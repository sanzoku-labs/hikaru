from fastapi import APIRouter, HTTPException
from app.models.schemas import AnalyzeResponse, ChartData
from app.services.data_processor import DataProcessor
from app.services.chart_generator import ChartGenerator
from app.services.ai_service import AIService
from datetime import datetime
import os
import pandas as pd

router = APIRouter(prefix="/api", tags=["analyze"])

UPLOAD_DIR = "uploads"

@router.get("/analyze/{upload_id}", response_model=AnalyzeResponse)
async def analyze_data(upload_id: str):
    """
    Analyze uploaded file and generate charts with AI insights.

    Takes an upload_id from a previous /upload call and:
    1. Generates charts based on data using priority-based heuristics
    2. Generates AI insights for each chart (if API key configured)
    3. Generates global summary (if API key configured)
    """

    # Find the file
    csv_path = os.path.join(UPLOAD_DIR, f"{upload_id}.csv")
    xlsx_path = os.path.join(UPLOAD_DIR, f"{upload_id}.xlsx")

    file_path = None
    file_extension = None

    if os.path.exists(csv_path):
        file_path = csv_path
        file_extension = "csv"
    elif os.path.exists(xlsx_path):
        file_path = xlsx_path
        file_extension = "xlsx"
    else:
        raise HTTPException(
            status_code=404,
            detail=f"File not found for upload_id: {upload_id}"
        )

    try:
        # Parse file
        processor = DataProcessor()
        df = processor.parse_file(file_path, file_extension)

        # Generate schema
        schema = processor.analyze_schema(df)

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

        # Get original filename from upload_id (we'll need to store this mapping)
        # For now, use the file extension
        filename = f"data.{file_extension}"

        return AnalyzeResponse(
            upload_id=upload_id,
            filename=filename,
            schema=schema,
            charts=charts,
            upload_timestamp=datetime.now(),
            global_summary=global_summary
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing file: {str(e)}"
        )
