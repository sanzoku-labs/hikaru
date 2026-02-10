"""
Chart Insights API routes - On-demand AI insights for individual charts.

This module provides endpoints for:
- Generating advanced AI insights for specific charts
- Smart caching using database + in-memory cache
- Hybrid persistence with on-demand generation
"""

import hashlib
import json
import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.rate_limit import limiter
from app.database import get_db
from app.middleware.auth import get_current_active_user
from app.models.database import ChartInsight, File, User
from app.models.schemas import ChartData, ChartInsightRequest, ChartInsightResponse, DataSchema
from app.services.ai_insight_service import AIInsightService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["chart-insights"])


def compute_chart_hash(chart_data: ChartInsightRequest) -> str:
    """
    Compute MD5 hash of chart configuration for caching.

    Args:
        chart_data: Chart insight request data

    Returns:
        MD5 hash string (64 characters)
    """
    # Create a stable representation of the chart config
    config = {
        "type": chart_data.chart_type,
        "title": chart_data.chart_title,
        "x": chart_data.x_column,
        "y": chart_data.y_column,
        "category": chart_data.category_column,
        "value": chart_data.value_column,
        # Include first and last data points for uniqueness
        "data_sample": [
            chart_data.chart_data[0] if chart_data.chart_data else None,
            chart_data.chart_data[-1] if chart_data.chart_data else None,
        ],
        "data_count": len(chart_data.chart_data),
    }

    config_str = json.dumps(config, sort_keys=True)
    return hashlib.md5(config_str.encode()).hexdigest()


@router.post("/charts/insight", response_model=ChartInsightResponse)
@limiter.limit("20/minute")
async def generate_chart_insight(
    request: Request,
    body: ChartInsightRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Generate advanced AI insight for a specific chart.

    **Caching Strategy:**
    1. Check database for existing insight (by chart_hash)
    2. Check in-memory cache (24-hour TTL)
    3. Generate new insight if not cached
    4. Save to database and memory cache

    **Args:**
    - file_id: ID of the file this chart belongs to
    - chart_type: Type of chart (line, bar, pie, scatter)
    - chart_title: Title of the chart
    - chart_data: Chart data points
    - x_column, y_column, etc.: Column mappings

    **Returns:**
    - insight: Generated AI insight text
    - insight_type: "advanced" (detailed analysis)
    - chart_hash: MD5 hash for caching
    - generated_at: Timestamp
    - model_version: AI model used
    - cached: Whether retrieved from cache
    """
    # Verify file exists and user has access
    file = db.query(File).filter(File.id == body.file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    # Verify user owns the project containing this file
    if file.project.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You don't have permission to access this file")

    # Compute chart hash for caching
    chart_hash = compute_chart_hash(body)

    # Check database for existing insight
    existing_insight = (
        db.query(ChartInsight)
        .filter(ChartInsight.file_id == body.file_id, ChartInsight.chart_hash == chart_hash)
        .first()
    )

    if existing_insight:
        logger.info(f"Database cache hit for chart insight: {chart_hash}")
        return ChartInsightResponse(
            insight=existing_insight.insight,
            insight_type=existing_insight.insight_type,
            chart_hash=existing_insight.chart_hash,
            generated_at=existing_insight.generated_at,
            model_version=existing_insight.model_version,
            cached=True,
        )

    # Generate new insight using AI service
    logger.info(f"Generating new advanced insight for chart: {body.chart_title}")

    # Initialize AI service without cache (database serves as cache)
    ai_service = AIInsightService(cache_service=None)

    # Reconstruct ChartData from body
    chart_data = ChartData(
        chart_type=body.chart_type,
        title=body.chart_title,
        x_column=body.x_column,
        y_column=body.y_column,
        category_column=body.category_column,
        value_column=body.value_column,
        data=body.chart_data,
        priority=1,  # Not used for insights
    )

    # Get file schema for context
    if file.schema_json:
        schema_dict = json.loads(file.schema_json)
        data_schema = DataSchema(**schema_dict)
    else:
        # Fallback if schema not available
        data_schema = DataSchema(columns=[], row_count=0, preview=[])

    # Generate advanced insight
    insight_text = ai_service.generate_advanced_chart_insight(
        chart=chart_data, schema=data_schema, chart_hash=chart_hash
    )

    if not insight_text:
        raise HTTPException(
            status_code=503,
            detail="AI service unavailable. Please ensure ANTHROPIC_API_KEY is configured.",
        )

    # Save to database
    new_insight = ChartInsight(
        file_id=body.file_id,
        chart_hash=chart_hash,
        chart_type=body.chart_type,
        chart_title=body.chart_title,
        insight=insight_text,
        insight_type="advanced",
        generated_at=datetime.utcnow(),
        model_version="claude-sonnet-4-20250514",
    )
    db.add(new_insight)
    db.commit()
    db.refresh(new_insight)

    logger.info(f"Saved new chart insight to database: {chart_hash}")

    return ChartInsightResponse(
        insight=new_insight.insight,
        insight_type=new_insight.insight_type,
        chart_hash=new_insight.chart_hash,
        generated_at=new_insight.generated_at,
        model_version=new_insight.model_version,
        cached=False,
    )
