import hashlib
import json
import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_active_user
from app.models.database import User
from app.models.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    ChartData,
    ChartInsightResponse,
    QuickChartInsightRequest,
)
from app.services.ai_insight_service import AIInsightService
from app.services.analysis_service import AnalysisService
from app.services.upload_service import UploadService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["analyze"])


@router.post("/analyze/{upload_id}", response_model=AnalyzeResponse)
async def analyze_data(
    upload_id: str,
    request: AnalyzeRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Analyze uploaded file and generate charts with AI-powered suggestions.

    Takes an upload_id from a previous /upload call and:
    1. Uses AI to intelligently suggest 3-4 meaningful charts (with optional user intent)
    2. Generates charts based on AI suggestions (fallback to heuristics if AI unavailable)
    3. Generates AI insights for each chart (if API key configured)
    4. Generates global summary (if API key configured)
    """

    # Get upload data from database using UploadService
    upload_service = UploadService(db)
    upload_data = upload_service.get_upload(upload_id)

    # Verify user owns this upload (security check)
    from app.models.database import Upload

    upload_record = db.query(Upload).filter_by(upload_id=upload_id).first()
    if upload_record and upload_record.user_id and upload_record.user_id != current_user.id:
        raise HTTPException(status_code=404, detail=f"Upload ID {upload_id} not found")

    try:
        # Get data from storage (already parsed)
        df = upload_data["dataframe"]
        schema = upload_data["schema"]
        filename = upload_data["filename"]

        logger.info(
            f"Starting analysis for upload_id={upload_id}, filename={filename}, user_intent={request.user_intent}"
        )
        logger.info(f"Dataset: {schema.row_count} rows, {len(schema.columns)} columns")

        # Use AnalysisService for complete analysis workflow
        analysis_service = AnalysisService()
        result = analysis_service.perform_full_analysis(
            df=df, schema=schema, user_intent=request.user_intent, max_charts=4
        )

        logger.info(
            f"Analysis complete: {len(result['charts'])} charts generated, "
            f"global_summary={'present' if result['global_summary'] else 'none'}"
        )

        return AnalyzeResponse(
            upload_id=upload_id,
            filename=filename,
            data_schema=schema,
            charts=result["charts"],
            upload_timestamp=upload_data["timestamp"],
            global_summary=result["global_summary"],
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing file: {str(e)}")


def _compute_chart_hash(request: QuickChartInsightRequest) -> str:
    """Compute MD5 hash of chart configuration for caching."""
    config = {
        "upload_id": request.upload_id,
        "type": request.chart_type,
        "title": request.chart_title,
        "x": request.x_column,
        "y": request.y_column,
        "category": request.category_column,
        "value": request.value_column,
        "data_sample": [
            request.chart_data[0] if request.chart_data else None,
            request.chart_data[-1] if request.chart_data else None,
        ],
        "data_count": len(request.chart_data),
    }
    config_str = json.dumps(config, sort_keys=True)
    return hashlib.md5(config_str.encode()).hexdigest()


@router.post("/analyze/{upload_id}/chart-insight", response_model=ChartInsightResponse)
async def generate_quick_chart_insight(
    upload_id: str,
    request: QuickChartInsightRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Generate AI insight for a single chart in quick analysis.

    This endpoint is for on-demand insight generation after the initial
    analysis has completed. Charts are initially returned without insights
    for faster response times.

    **Args:**
    - upload_id: Upload ID from the initial file upload
    - chart_type: Type of chart (line, bar, pie, scatter)
    - chart_title: Title of the chart
    - chart_data: Chart data points
    - x_column, y_column, etc.: Column mappings

    **Returns:**
    - insight: Generated AI insight text
    - insight_type: "basic" (2-3 sentences)
    - chart_hash: MD5 hash for caching
    - generated_at: Timestamp
    - model_version: AI model used
    - cached: Whether retrieved from cache
    """
    # Verify upload_id matches
    if upload_id != request.upload_id:
        raise HTTPException(status_code=400, detail="Upload ID mismatch")

    # Get upload data to access schema for context
    upload_service = UploadService(db)
    try:
        upload_data = upload_service.get_upload(upload_id)
    except Exception:
        raise HTTPException(status_code=404, detail=f"Upload ID {upload_id} not found")

    # Verify user owns this upload
    from app.models.database import Upload

    upload_record = db.query(Upload).filter_by(upload_id=upload_id).first()
    if upload_record and upload_record.user_id and upload_record.user_id != current_user.id:
        raise HTTPException(status_code=404, detail=f"Upload ID {upload_id} not found")

    # Compute chart hash for response
    chart_hash = _compute_chart_hash(request)

    # Reconstruct ChartData from request
    chart_data = ChartData(
        chart_type=request.chart_type,
        title=request.chart_title,
        x_column=request.x_column,
        y_column=request.y_column,
        category_column=request.category_column,
        value_column=request.value_column,
        data=request.chart_data,
        priority=1,
    )

    # Get schema for context
    schema = upload_data["schema"]

    # Generate insight using AI service (uses in-memory cache)
    ai_service = AIInsightService()
    insight_text = ai_service.generate_chart_insight(chart=chart_data, schema=schema)

    if not insight_text:
        raise HTTPException(
            status_code=503,
            detail="AI service unavailable. Please ensure ANTHROPIC_API_KEY is configured.",
        )

    return ChartInsightResponse(
        insight=insight_text,
        insight_type="basic",
        chart_hash=chart_hash,
        generated_at=datetime.utcnow(),
        model_version="claude-sonnet-4-20250514",
        cached=False,  # In-memory cache is transparent to caller
    )
