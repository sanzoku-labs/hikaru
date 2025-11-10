from fastapi import APIRouter, HTTPException
from app.models.schemas import AnalyzeResponse, ChartData
from app.services.data_processor import DataProcessor
from app.services.chart_generator import ChartGenerator
from datetime import datetime
import os
import pandas as pd

router = APIRouter(prefix="/api", tags=["analyze"])

UPLOAD_DIR = "uploads"

@router.get("/analyze/{upload_id}", response_model=AnalyzeResponse)
async def analyze_data(upload_id: str):
    """
    Analyze uploaded file and generate charts.

    Takes an upload_id from a previous /upload call and generates
    charts based on the data using priority-based heuristics.
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

        # Get original filename from upload_id (we'll need to store this mapping)
        # For now, use the file extension
        filename = f"data.{file_extension}"

        return AnalyzeResponse(
            upload_id=upload_id,
            filename=filename,
            schema=schema,
            charts=charts,
            upload_timestamp=datetime.now()
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing file: {str(e)}"
        )
