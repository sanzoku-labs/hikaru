"""
Reports routes - Template gallery and report generation.

New feature added in Phase 11 (Feature Expansion).
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_active_user
from app.models.database import User
from app.models.schemas import (
    ReportGenerateRequest,
    ReportGenerateResponse,
    ReportListResponse,
    ReportTemplateListResponse,
)
from app.services.report_service import ReportService

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/templates", response_model=ReportTemplateListResponse)
async def list_templates(
    current_user: User = Depends(get_current_active_user),
) -> ReportTemplateListResponse:
    """
    List all available report templates.

    Returns pre-defined templates like Weekly Summary, Executive Brief, etc.
    """
    # Templates don't need DB access, but we still require auth
    from app.services.report_service import REPORT_TEMPLATES
    from app.models.schemas import ReportTemplate

    templates = [ReportTemplate(**t) for t in REPORT_TEMPLATES]
    return ReportTemplateListResponse(templates=templates, total=len(templates))


@router.post("/generate", response_model=ReportGenerateResponse)
async def generate_report(
    request: ReportGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> ReportGenerateResponse:
    """
    Generate a report based on a template.

    Creates a PDF report with the specified template and data sources.
    Reports expire after 24 hours.
    """
    service = ReportService(db)

    try:
        response = service.generate_report(
            user_id=current_user.id,
            request=request,
        )
        return response

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate report: {str(e)}",
        )


@router.get("", response_model=ReportListResponse)
async def list_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> ReportListResponse:
    """
    List all generated reports for the current user.

    Only includes non-expired reports.
    """
    service = ReportService(db)
    return service.list_reports(user_id=current_user.id)


@router.get("/{report_id}/download")
async def download_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Download a generated report PDF.
    """
    service = ReportService(db)
    pdf_path = service.get_report_path(report_id)

    if not pdf_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found or expired",
        )

    return FileResponse(
        path=str(pdf_path),
        filename=f"report_{report_id}.pdf",
        media_type="application/pdf",
    )


@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> None:
    """
    Delete a generated report.
    """
    service = ReportService(db)

    if not service.delete_report(user_id=current_user.id, report_id=report_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )
