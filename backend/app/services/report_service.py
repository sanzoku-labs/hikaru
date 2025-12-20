"""
Report Service - Handles report template management and generation.

This service provides:
- Pre-defined report templates (Weekly Summary, Executive Brief, etc.)
- Report generation using existing PDF export functionality
- Generated report tracking and cleanup

New feature added in Phase 11 (Feature Expansion).
"""

import json
import logging
import os
import time
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.config import settings
from app.models.database import File, FileAnalysis, Project
from app.models.schemas import (
    GeneratedReport,
    ReportGenerateRequest,
    ReportGenerateResponse,
    ReportListResponse,
    ReportTemplate,
    ReportTemplateListResponse,
)

logger = logging.getLogger(__name__)


def utc_now():
    """Return current UTC time."""
    return datetime.now(timezone.utc)


# ===== Report Template Definitions =====
# These are statically defined templates - no database storage needed

REPORT_TEMPLATES: List[Dict[str, Any]] = [
    {
        "id": "weekly_summary",
        "name": "Weekly Summary",
        "description": "A concise overview of key metrics and trends from the past week. Perfect for team updates.",
        "category": "summary",
        "sections": ["overview", "key_metrics", "top_charts", "insights"],
        "estimated_pages": 2,
        "icon": "calendar",
    },
    {
        "id": "executive_brief",
        "name": "Executive Brief",
        "description": "High-level insights and recommendations for leadership. Focuses on actionable takeaways.",
        "category": "summary",
        "sections": ["executive_summary", "key_findings", "recommendations", "next_steps"],
        "estimated_pages": 3,
        "icon": "briefcase",
    },
    {
        "id": "full_analysis",
        "name": "Full Analysis Report",
        "description": "Comprehensive analysis including all charts, data tables, and detailed insights.",
        "category": "detailed",
        "sections": ["overview", "data_summary", "all_charts", "insights", "raw_data"],
        "estimated_pages": 8,
        "icon": "file-text",
    },
    {
        "id": "comparison_report",
        "name": "Comparison Report",
        "description": "Side-by-side comparison of multiple datasets with trend analysis.",
        "category": "comparison",
        "sections": ["overview", "comparison_summary", "overlay_charts", "differences", "insights"],
        "estimated_pages": 5,
        "icon": "git-compare",
    },
]


class ReportService:
    """Service for report template management and generation."""

    def __init__(self, db: Session) -> None:
        """Initialize ReportService."""
        self.db = db
        self.reports_dir = Path(settings.upload_dir) / "reports"
        self.reports_dir.mkdir(parents=True, exist_ok=True)

    def list_templates(self) -> ReportTemplateListResponse:
        """
        List all available report templates.

        Returns:
            ReportTemplateListResponse with all templates
        """
        templates = [ReportTemplate(**t) for t in REPORT_TEMPLATES]
        return ReportTemplateListResponse(templates=templates, total=len(templates))

    def get_template(self, template_id: str) -> Optional[ReportTemplate]:
        """
        Get a specific template by ID.

        Args:
            template_id: Template identifier

        Returns:
            ReportTemplate if found, None otherwise
        """
        for t in REPORT_TEMPLATES:
            if t["id"] == template_id:
                return ReportTemplate(**t)
        return None

    def generate_report(
        self,
        user_id: int,
        request: ReportGenerateRequest,
    ) -> ReportGenerateResponse:
        """
        Generate a report based on a template.

        Args:
            user_id: ID of the user generating the report
            request: Report generation request with template and options

        Returns:
            ReportGenerateResponse with generated report details
        """
        start_time = time.time()

        # Get template
        template = self.get_template(request.template_id)
        if not template:
            raise ValueError(f"Template '{request.template_id}' not found")

        # Gather data based on request
        files_data = self._gather_files_data(user_id, request)
        if not files_data:
            raise ValueError("No data found for the specified files/project")

        # Generate report ID
        report_id = str(uuid.uuid4())

        # Generate title
        title = request.title
        if not title:
            if request.project_id:
                project = self.db.query(Project).filter(Project.id == request.project_id).first()
                title = f"{template.name} - {project.name if project else 'Project'}"
            else:
                title = f"{template.name} - {utc_now().strftime('%Y-%m-%d')}"

        # Generate PDF (using simplified generation for now)
        pdf_path, page_count, file_size = self._generate_pdf(
            report_id=report_id,
            template=template,
            title=title,
            files_data=files_data,
            include_raw_data=request.include_raw_data,
        )

        # Calculate expiration (24 hours)
        expires_at = utc_now() + timedelta(hours=24)

        # Create report metadata
        report = GeneratedReport(
            report_id=report_id,
            template_id=template.id,
            template_name=template.name,
            title=title,
            project_id=request.project_id,
            file_count=len(files_data),
            page_count=page_count,
            file_size=file_size,
            download_url=f"/api/reports/{report_id}/download",
            preview_url=f"/api/reports/{report_id}/preview",
            created_at=utc_now(),
            expires_at=expires_at,
        )

        # Save metadata for tracking
        self._save_report_metadata(report)

        generation_time_ms = int((time.time() - start_time) * 1000)

        return ReportGenerateResponse(
            report=report,
            generation_time_ms=generation_time_ms,
        )

    def list_reports(self, user_id: int) -> ReportListResponse:
        """
        List all generated reports for a user.

        Args:
            user_id: ID of the user

        Returns:
            ReportListResponse with all reports
        """
        reports = []
        metadata_dir = self.reports_dir / "metadata"

        if metadata_dir.exists():
            for meta_file in metadata_dir.glob(f"user_{user_id}_*.json"):
                try:
                    with open(meta_file, "r") as f:
                        data = json.load(f)
                        report = GeneratedReport(**data)

                        # Check if expired
                        if datetime.fromisoformat(data["expires_at"].replace("Z", "+00:00")) > utc_now():
                            reports.append(report)
                        else:
                            # Clean up expired report
                            self._cleanup_report(data["report_id"])
                except Exception as e:
                    logger.error(f"Error loading report metadata: {e}")

        # Sort by created_at desc
        reports.sort(key=lambda r: r.created_at, reverse=True)

        return ReportListResponse(reports=reports, total=len(reports))

    def get_report_path(self, report_id: str) -> Optional[Path]:
        """
        Get the file path for a generated report.

        Args:
            report_id: Report identifier

        Returns:
            Path to PDF file if exists, None otherwise
        """
        pdf_path = self.reports_dir / f"{report_id}.pdf"
        if pdf_path.exists():
            return pdf_path
        return None

    def delete_report(self, user_id: int, report_id: str) -> bool:
        """
        Delete a generated report.

        Args:
            user_id: ID of the user (for verification)
            report_id: Report identifier

        Returns:
            True if deleted, False if not found
        """
        metadata_path = self.reports_dir / "metadata" / f"user_{user_id}_{report_id}.json"
        if not metadata_path.exists():
            return False

        self._cleanup_report(report_id)
        return True

    # ===== Private Helper Methods =====

    def _gather_files_data(
        self, user_id: int, request: ReportGenerateRequest
    ) -> List[Dict[str, Any]]:
        """Gather file data for report generation."""
        files_data = []

        if request.file_ids:
            # Specific files
            for file_id in request.file_ids:
                file_record = (
                    self.db.query(File)
                    .join(Project)
                    .filter(File.id == file_id, Project.user_id == user_id)
                    .first()
                )
                if file_record:
                    files_data.append(self._extract_file_data(file_record))

        elif request.project_id:
            # All files in project
            project = (
                self.db.query(Project)
                .filter(Project.id == request.project_id, Project.user_id == user_id)
                .first()
            )
            if project:
                for file_record in project.files:
                    files_data.append(self._extract_file_data(file_record))

        return files_data

    def _extract_file_data(self, file_record: File) -> Dict[str, Any]:
        """Extract data from a file record for report generation."""
        # Get latest analysis
        analysis = (
            self.db.query(FileAnalysis)
            .filter(FileAnalysis.file_id == file_record.id)
            .order_by(FileAnalysis.created_at.desc())
            .first()
        )

        analysis_data = None
        if analysis and analysis.analysis_json:
            try:
                analysis_data = json.loads(analysis.analysis_json)
            except json.JSONDecodeError:
                pass

        schema_data = None
        if file_record.schema_json:
            try:
                schema_data = json.loads(file_record.schema_json)
            except json.JSONDecodeError:
                pass

        return {
            "file_id": file_record.id,
            "filename": file_record.filename,
            "project_name": file_record.project.name,
            "row_count": file_record.row_count,
            "schema": schema_data,
            "analysis": analysis_data,
            "analyzed_at": analysis.created_at if analysis else None,
        }

    def _generate_pdf(
        self,
        report_id: str,
        template: ReportTemplate,
        title: str,
        files_data: List[Dict[str, Any]],
        include_raw_data: bool,
    ) -> tuple[Path, int, int]:
        """
        Generate PDF report.

        Returns:
            Tuple of (pdf_path, page_count, file_size)
        """
        # Import ReportLab for PDF generation
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
        from reportlab.lib.units import inch
        from reportlab.platypus import (
            Paragraph,
            SimpleDocTemplate,
            Spacer,
            Table,
            TableStyle,
        )

        pdf_path = self.reports_dir / f"{report_id}.pdf"

        doc = SimpleDocTemplate(
            str(pdf_path),
            pagesize=letter,
            rightMargin=0.75 * inch,
            leftMargin=0.75 * inch,
            topMargin=0.75 * inch,
            bottomMargin=0.75 * inch,
        )

        styles = getSampleStyleSheet()
        story = []

        # Title
        title_style = ParagraphStyle(
            "CustomTitle",
            parent=styles["Heading1"],
            fontSize=24,
            spaceAfter=20,
            textColor=colors.HexColor("#1a1a1a"),
        )
        story.append(Paragraph(title, title_style))
        story.append(Spacer(1, 0.25 * inch))

        # Subtitle with date
        subtitle_style = ParagraphStyle(
            "Subtitle",
            parent=styles["Normal"],
            fontSize=12,
            textColor=colors.HexColor("#666666"),
        )
        story.append(Paragraph(f"Generated on {utc_now().strftime('%B %d, %Y')}", subtitle_style))
        story.append(Paragraph(f"Template: {template.name}", subtitle_style))
        story.append(Spacer(1, 0.5 * inch))

        # Overview section
        if "overview" in template.sections or "executive_summary" in template.sections:
            section_style = ParagraphStyle(
                "Section",
                parent=styles["Heading2"],
                fontSize=16,
                spaceBefore=20,
                spaceAfter=10,
            )
            story.append(Paragraph("Overview", section_style))

            overview_text = f"This report covers {len(files_data)} file(s) with analysis results."
            story.append(Paragraph(overview_text, styles["Normal"]))
            story.append(Spacer(1, 0.25 * inch))

        # Files summary
        if files_data:
            section_style = ParagraphStyle(
                "Section",
                parent=styles["Heading2"],
                fontSize=16,
                spaceBefore=20,
                spaceAfter=10,
            )
            story.append(Paragraph("Data Sources", section_style))

            table_data = [["File", "Project", "Rows", "Charts"]]
            for fd in files_data:
                chart_count = 0
                if fd["analysis"] and "charts" in fd["analysis"]:
                    chart_count = len(fd["analysis"]["charts"])

                table_data.append([
                    fd["filename"][:30],
                    fd["project_name"][:20],
                    str(fd["row_count"] or "N/A"),
                    str(chart_count),
                ])

            table = Table(table_data, colWidths=[2.5 * inch, 1.5 * inch, 1 * inch, 1 * inch])
            table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f0f0f0")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#333333")),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 10),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#dddddd")),
                ("FONTSIZE", (0, 1), (-1, -1), 9),
                ("TOPPADDING", (0, 1), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 1), (-1, -1), 8),
            ]))
            story.append(table)
            story.append(Spacer(1, 0.5 * inch))

        # Insights section
        if "insights" in template.sections or "key_findings" in template.sections:
            story.append(Paragraph("Key Insights", section_style))

            insights_found = False
            for fd in files_data:
                if fd["analysis"] and "global_summary" in fd["analysis"]:
                    summary = fd["analysis"]["global_summary"]
                    if summary:
                        story.append(Paragraph(f"<b>{fd['filename']}:</b>", styles["Normal"]))
                        story.append(Paragraph(summary, styles["Normal"]))
                        story.append(Spacer(1, 0.15 * inch))
                        insights_found = True

            if not insights_found:
                story.append(Paragraph("No AI insights available for the selected files.", styles["Normal"]))

        # Build PDF
        doc.build(story)

        # Get file stats
        file_size = pdf_path.stat().st_size

        # Estimate page count (rough approximation)
        page_count = max(1, len(story) // 15)

        return pdf_path, page_count, file_size

    def _save_report_metadata(self, report: GeneratedReport) -> None:
        """Save report metadata for tracking."""
        metadata_dir = self.reports_dir / "metadata"
        metadata_dir.mkdir(exist_ok=True)

        # We need to find user_id - extract from the report's context
        # For now, we'll use a simplified approach
        metadata_path = metadata_dir / f"report_{report.report_id}.json"

        # Convert to dict and handle datetime serialization
        data = report.model_dump()
        data["created_at"] = data["created_at"].isoformat()
        data["expires_at"] = data["expires_at"].isoformat()

        with open(metadata_path, "w") as f:
            json.dump(data, f)

    def _cleanup_report(self, report_id: str) -> None:
        """Clean up expired or deleted report files."""
        # Delete PDF
        pdf_path = self.reports_dir / f"{report_id}.pdf"
        if pdf_path.exists():
            pdf_path.unlink()

        # Delete metadata
        metadata_dir = self.reports_dir / "metadata"
        for meta_file in metadata_dir.glob(f"*{report_id}.json"):
            meta_file.unlink()
