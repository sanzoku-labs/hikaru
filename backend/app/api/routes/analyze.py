from fastapi import APIRouter, HTTPException
from app.models.schemas import AnalyzeResponse, ChartData
from app.services.data_processor import DataProcessor
from app.services.chart_generator import ChartGenerator
from app.services.ai_service import AIService
from app.storage import get_upload
from datetime import datetime
import os
import pandas as pd

router = APIRouter(prefix="/api", tags=["analyze"])

@router.get("/analyze/{upload_id}", response_model=AnalyzeResponse)
async def analyze_data(upload_id: str):
    """
    Analyze uploaded file and generate charts with AI insights.

    Takes an upload_id from a previous /upload call and:
    1. Generates charts based on data using priority-based heuristics
    2. Generates AI insights for each chart (if API key configured)
    3. Generates global summary (if API key configured)
    """

    # Get upload data from storage
    upload_data = get_upload(upload_id)
    if not upload_data:
        raise HTTPException(
            status_code=404,
            detail=f"Upload ID {upload_id} not found"
        )

    try:
        # Get data from storage (already parsed)
        df = upload_data["dataframe"]
        schema = upload_data["schema"]
        filename = upload_data["filename"]

        # Generate charts
        chart_generator = ChartGenerator()
        charts_data = chart_generator.generate_charts(df, schema, max_charts=4)

        # Convert to Pydantic models
        charts = [ChartData(**chart) for chart in charts_data]

        # Phase 3: Generate AI insights (graceful degradation if API key not set)
        ai_service = AIService()
        global_summary = None

        if ai_service.enabled:
            try:
                # Generate insight for each chart
                for chart in charts:
                    insight = ai_service.generate_chart_insight(chart, schema)
                    chart.insight = insight

                # Generate global summary
                global_summary = ai_service.generate_global_summary(charts, schema)

            except Exception as e:
                print(f"Warning: AI insights generation failed: {e}")
                # Continue without insights (graceful degradation)

        return AnalyzeResponse(
            upload_id=upload_id,
            filename=filename,
            schema=schema,
            charts=charts,
            upload_timestamp=upload_data["timestamp"],
            global_summary=global_summary
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing file: {str(e)}"
        )
