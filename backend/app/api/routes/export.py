from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from app.models.schemas import ExportRequest, ExportResponse
from app.services.export_service import ExportService
from app.storage import get_upload
from datetime import datetime
import os

router = APIRouter(prefix="/api", tags=["export"])


@router.post("/export", response_model=ExportResponse)
async def export_dashboard(request: ExportRequest):
    """
    Generate PDF export of dashboard (data preview, charts, AI insights).

    Returns export_id and download URL.
    """
    # Validate upload_id exists
    upload_data = get_upload(request.upload_id)
    if not upload_data:
        raise HTTPException(
            status_code=404,
            detail=f"Upload ID {request.upload_id} not found"
        )

    # Get data from upload (need to re-generate charts for export)
    from app.services.chart_generator import ChartGenerator
    from app.services.ai_service import AIService

    filename = upload_data["filename"]
    schema = upload_data["schema"]
    df = upload_data["dataframe"]

    # Generate charts
    chart_generator = ChartGenerator()
    charts_data = chart_generator.generate_charts(df, schema, max_charts=4)

    # Convert to Pydantic models
    from app.models.schemas import ChartData
    charts = [ChartData(**chart) for chart in charts_data]

    # Generate AI insights if available
    global_summary = None
    ai_service = AIService()
    if ai_service.enabled:
        try:
            # Generate insight for each chart
            for chart in charts:
                insight = ai_service.generate_chart_insight(chart, schema)
                chart.insight = insight

            # Generate global summary
            global_summary = ai_service.generate_global_summary(charts, schema)
        except Exception as e:
            print(f"Warning: AI insights generation failed for export: {e}")
            # Continue without insights

    # Generate PDF
    export_service = ExportService()
    export_id = export_service.generate_pdf(
        filename=filename,
        schema=schema,
        charts=charts,
        global_summary=global_summary
    )

    # Cleanup old exports (1-hour retention)
    export_service.cleanup_old_exports(max_age_hours=1)

    return ExportResponse(
        export_id=export_id,
        download_url=f"/api/download/{export_id}",
        filename=f"{export_id}.pdf",
        generated_at=datetime.now()
    )


@router.get("/download/{export_id}")
async def download_export(export_id: str):
    """Download generated PDF export"""
    export_service = ExportService()
    filepath = export_service.get_export_path(export_id)

    if not os.path.exists(filepath):
        raise HTTPException(
            status_code=404,
            detail="Export not found or has expired"
        )

    return FileResponse(
        filepath,
        media_type="application/pdf",
        filename=f"hikaru-dashboard-{export_id[:8]}.pdf"
    )
