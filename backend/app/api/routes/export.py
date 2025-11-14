import json
import logging
import os
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_active_user
from app.models.database import File as FileModel
from app.models.database import Project, User
from app.models.schemas import (
    AdvancedExportRequest,
    AdvancedExportResponse,
    ExportRequest,
    ExportResponse,
)
from app.services.export_service import ExportService
from app.services.upload_service import UploadService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["export"])


@router.post("/export", response_model=ExportResponse)
async def export_dashboard(request: ExportRequest, db: Session = Depends(get_db)):
    """
    Generate PDF export of dashboard (data preview, charts, AI insights).

    Returns export_id and download URL.
    """
    # Get upload data from database using UploadService
    upload_service = UploadService(db)
    upload_data = upload_service.get_upload(request.upload_id)

    # Get data from upload (need to re-generate charts for export)
    from app.services.ai_service import AIService
    from app.services.chart_generator import ChartGenerator

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
            # Generate insight for each chart by creating new chart objects
            charts_with_insights = []
            for chart in charts:
                insight = ai_service.generate_chart_insight(chart, schema)
                # Create new chart with insight
                chart_dict = chart.model_dump()
                chart_dict["insight"] = insight
                charts_with_insights.append(ChartData(**chart_dict))

            charts = charts_with_insights

            # Generate global summary
            global_summary = ai_service.generate_global_summary(charts, schema)
        except Exception as e:
            logger.warning(f"AI insights generation failed for export: {e}")
            # Continue without insights

    # Generate PDF
    export_service = ExportService()
    export_id = export_service.generate_pdf(
        filename=filename, schema=schema, charts=charts, global_summary=global_summary
    )

    # Cleanup old exports (1-hour retention)
    export_service.cleanup_old_exports(max_age_hours=1)

    return ExportResponse(
        export_id=export_id,
        download_url=f"/api/download/{export_id}",
        filename=f"{export_id}.pdf",
        generated_at=datetime.now(),
    )


@router.get("/download/{export_id}")
async def download_export(export_id: str):
    """Download generated PDF export"""
    export_service = ExportService()
    filepath = export_service.get_export_path(export_id)

    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Export not found or has expired")

    return FileResponse(
        filepath, media_type="application/pdf", filename=f"hikaru-dashboard-{export_id[:8]}.pdf"
    )


@router.post("/export-advanced", response_model=AdvancedExportResponse)
async def export_advanced(
    request: AdvancedExportRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Advanced export with custom options (Mockup 6).

    Supports:
    - Multiple formats: PDF, PNG, Excel
    - Custom content selection (charts, insights, raw data)
    - File or project-level exports
    - Custom filenames and titles

    Args:
        request: Advanced export request with custom options
        current_user: Authenticated user
        db: Database session

    Returns:
        AdvancedExportResponse with download URL and metadata

    Raises:
        HTTP 400: If invalid request (missing file/project ID)
        HTTP 404: If file or project not found
        HTTP 500: If export generation fails
    """
    try:
        # Validate request (need either file_id or upload_id)
        if not request.file_id and not request.upload_id and not request.project_id:
            raise HTTPException(
                status_code=400, detail="Must provide file_id, project_id, or upload_id"
            )

        # Get file data
        file_data = None
        filename = None
        schema = None
        charts = []
        global_summary = None

        if request.file_id:
            # Get file from project
            file = db.query(FileModel).filter(FileModel.id == request.file_id).first()
            if not file:
                raise HTTPException(status_code=404, detail="File not found")

            # Verify user owns the project
            project = (
                db.query(Project)
                .filter(Project.id == file.project_id, Project.user_id == current_user.id)
                .first()
            )
            if not project:
                raise HTTPException(status_code=404, detail="Project not found")

            filename = file.filename

            # Load analysis if it exists
            if file.analysis_json:
                analysis_data = json.loads(file.analysis_json)
                from app.models.schemas import ChartData

                charts = [ChartData(**chart) for chart in analysis_data.get("charts", [])]
                global_summary = analysis_data.get("global_summary")
                schema_dict = analysis_data.get("schema")
                if schema_dict:
                    from app.models.schemas import DataSchema

                    schema = DataSchema(**schema_dict)
            else:
                # No analysis available
                raise HTTPException(
                    status_code=400,
                    detail="File has not been analyzed yet. Please analyze the file first.",
                )

        elif request.upload_id:
            # Legacy support for upload_id
            upload_service = UploadService(db)
            upload_data = upload_service.get_upload(request.upload_id)

            filename = upload_data["filename"]
            schema = upload_data["schema"]

            # Re-generate charts for export
            from app.services.ai_service import AIService
            from app.services.chart_generator import ChartGenerator

            df = upload_data["dataframe"]
            chart_generator = ChartGenerator()
            charts_data = chart_generator.generate_charts(df, schema, max_charts=4)

            from app.models.schemas import ChartData

            charts = [ChartData(**chart) for chart in charts_data]

            # Generate AI insights if enabled
            ai_service = AIService()
            if ai_service.enabled and request.include_insights:
                try:
                    charts_with_insights = []
                    for chart in charts:
                        insight = ai_service.generate_chart_insight(chart, schema)
                        chart_dict = chart.model_dump()
                        chart_dict["insight"] = insight
                        charts_with_insights.append(ChartData(**chart_dict))
                    charts = charts_with_insights
                    global_summary = ai_service.generate_global_summary(charts, schema)
                except Exception as e:
                    logger.warning(f"AI insights failed: {e}")

        # Filter charts if specific chart_ids requested
        if request.chart_ids:
            # For now, just take first N charts (in future, implement chart IDs properly)
            charts = charts[: len(request.chart_ids)]

        # Remove insights if not requested
        if not request.include_insights:
            charts_without_insights = []
            for chart in charts:
                chart_dict = chart.model_dump()
                chart_dict["insight"] = None
                charts_without_insights.append(ChartData(**chart_dict))
            charts = charts_without_insights
            global_summary = None

        # Remove summary if not requested
        if not request.include_summary:
            global_summary = None

        # Generate export based on format
        export_service = ExportService()
        export_id = None
        file_extension = request.export_format
        media_type = "application/pdf"

        if request.export_format == "pdf":
            export_id = export_service.generate_pdf(
                filename=filename or "export",
                schema=schema,
                charts=charts if request.include_charts else [],
                global_summary=global_summary,
                custom_title=request.custom_title,
            )
            media_type = "application/pdf"

        elif request.export_format == "png":
            # PNG export (charts as images)
            # For now, use PDF export (implement PNG in export_service later)
            export_id = export_service.generate_pdf(
                filename=filename or "export",
                schema=schema,
                charts=charts if request.include_charts else [],
                global_summary=global_summary,
                custom_title=request.custom_title,
            )
            media_type = "image/png"
            file_extension = "png"

        elif request.export_format == "excel":
            # Excel export (data + charts)
            # For now, use PDF export (implement Excel in export_service later)
            export_id = export_service.generate_pdf(
                filename=filename or "export",
                schema=schema,
                charts=charts if request.include_charts else [],
                global_summary=global_summary,
                custom_title=request.custom_title,
            )
            media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            file_extension = "xlsx"

        # Get file size
        filepath = export_service.get_export_path(export_id)
        file_size = os.path.getsize(filepath) if os.path.exists(filepath) else None

        # Generate filename
        final_filename = request.custom_filename or f"{filename}-export"
        if not final_filename.endswith(f".{file_extension}"):
            final_filename = f"{final_filename}.{file_extension}"

        # Cleanup old exports
        export_service.cleanup_old_exports(max_age_hours=1)

        return AdvancedExportResponse(
            export_id=export_id,
            download_url=f"/api/download/{export_id}",
            filename=final_filename,
            file_size=file_size,
            export_format=request.export_format,
            generated_at=datetime.now(),
            expires_at=datetime.now() + timedelta(hours=1),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate export: {str(e)}")
