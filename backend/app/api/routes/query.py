import logging
from datetime import datetime

import pandas as pd
from fastapi import APIRouter, HTTPException

from app.models.schemas import ChartData, QueryRequest, QueryResponse
from app.services.ai_service import AIService
from app.services.chart_generator import ChartGenerator
from app.storage import get_upload

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["query"])


@router.post("/query", response_model=QueryResponse)
async def query_data(request: QueryRequest):
    """
    Answer natural language questions about uploaded data.

    Phase 4A: Returns text-only answers with conversation context.
    Phase 4B: Generates charts when user requests visualization.
    """
    # Validate upload_id exists
    upload_data = get_upload(request.upload_id)
    if not upload_data:
        raise HTTPException(status_code=404, detail=f"Upload ID {request.upload_id} not found")

    schema = upload_data["schema"]
    df = upload_data["dataframe"]

    # Generate AI response
    ai_service = AIService()
    if not ai_service.enabled:
        raise HTTPException(
            status_code=503,
            detail="AI service is not available. Please configure ANTHROPIC_API_KEY.",
        )

    answer, conversation_id, chart_config = ai_service.generate_query_response(
        upload_id=request.upload_id,
        question=request.question,
        schema=schema,
        conversation_id=request.conversation_id,
    )

    # Generate chart if requested
    chart = None
    if chart_config:
        try:
            chart = _generate_chart_from_config(df, schema, chart_config)
        except Exception as e:
            logger.warning(f"Failed to generate chart: {e}")
            # Continue without chart (graceful degradation)

    return QueryResponse(
        answer=answer, conversation_id=conversation_id, timestamp=datetime.now(), chart=chart
    )


def _generate_chart_from_config(df: pd.DataFrame, schema, config: dict) -> ChartData:
    """Generate a chart based on AI-provided configuration"""
    chart_type = config.get("chart_type")
    title = config.get("title", "Generated Chart")

    chart_generator = ChartGenerator()

    if chart_type == "line":
        x_col = config.get("x_column")
        y_col = config.get("y_column")
        if x_col and y_col and x_col in df.columns and y_col in df.columns:
            chart_data = chart_generator._generate_line_chart(df, x_col, y_col, schema)
            chart_data["title"] = title
            return ChartData(**chart_data)

    elif chart_type == "bar":
        cat_col = config.get("category_column") or config.get("x_column")
        val_col = config.get("value_column") or config.get("y_column")
        if cat_col and val_col and cat_col in df.columns and val_col in df.columns:
            chart_data = chart_generator._generate_bar_chart(df, cat_col, val_col)
            chart_data["title"] = title
            return ChartData(**chart_data)

    elif chart_type == "pie":
        cat_col = config.get("category_column")
        val_col = config.get("value_column")
        if cat_col and val_col and cat_col in df.columns and val_col in df.columns:
            chart_data = chart_generator._generate_pie_chart(df, cat_col, val_col)
            chart_data["title"] = title
            return ChartData(**chart_data)

    elif chart_type == "scatter":
        x_col = config.get("x_column")
        y_col = config.get("y_column")
        if x_col and y_col and x_col in df.columns and y_col in df.columns:
            chart_data = chart_generator._generate_scatter_chart(df, x_col, y_col)
            chart_data["title"] = title
            return ChartData(**chart_data)

    raise ValueError(f"Invalid chart configuration: {config}")
