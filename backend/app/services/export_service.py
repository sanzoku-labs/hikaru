"""
PDF Export service using ReportLab for professional dashboard reports.
"""

import logging
import os
import uuid
from datetime import datetime
from typing import List

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.models.schemas import ChartData, DataSchema

logger = logging.getLogger(__name__)


class ExportService:
    """Service for exporting dashboards to PDF format"""

    def __init__(self):
        self.export_dir = "exports"
        os.makedirs(self.export_dir, exist_ok=True)

    def generate_pdf(
        self,
        filename: str,
        schema: DataSchema,
        charts: List[ChartData],
        global_summary: str | None = None,
    ) -> str:
        """
        Generate PDF report from dashboard data.

        Returns: export_id (filename without extension)
        """
        export_id = str(uuid.uuid4())
        pdf_path = os.path.join(self.export_dir, f"{export_id}.pdf")

        # Create PDF document
        doc = SimpleDocTemplate(
            pdf_path,
            pagesize=A4,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18,
        )

        # Build content
        story = []
        styles = self._get_styles()

        # Header
        story.append(Paragraph("🎯 Hikaru Dashboard Report", styles["CustomTitle"]))
        story.append(Paragraph(f"<b>File:</b> {filename}", styles["CustomSubtitle"]))
        story.append(
            Paragraph(
                f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
                styles["CustomSubtitle"],
            )
        )
        story.append(Spacer(1, 0.3 * inch))

        # Global Summary
        if global_summary:
            story.append(Paragraph("📊 Data Summary", styles["CustomHeading1"]))
            story.append(Paragraph(global_summary, styles["CustomBodyText"]))
            story.append(Spacer(1, 0.2 * inch))

        # Dataset Overview
        story.append(Paragraph("📁 Dataset Overview", styles["CustomHeading1"]))
        story.append(
            Paragraph(
                f"<b>Total Rows:</b> {schema.row_count:,} | <b>Total Columns:</b> {len(schema.columns)}",
                styles["CustomBodyText"],
            )
        )
        story.append(Spacer(1, 0.1 * inch))

        # Column Details Table
        col_data = [["Column Name", "Type", "Unique Values", "Null Count"]]
        for col in schema.columns:
            col_data.append(
                [
                    col.name,
                    col.type.title(),
                    str(col.unique_values) if col.unique_values else "N/A",
                    str(col.null_count),
                ]
            )

        col_table = Table(col_data, colWidths=[2 * inch, 1.2 * inch, 1.2 * inch, 1 * inch])
        col_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#3b82f6")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, 0), 10),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                    ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
                    ("GRID", (0, 0), (-1, -1), 1, colors.grey),
                    ("FONTSIZE", (0, 1), (-1, -1), 9),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
                ]
            )
        )
        story.append(col_table)
        story.append(Spacer(1, 0.3 * inch))

        # Data Preview
        story.append(Paragraph("📊 Data Preview (First 10 Rows)", styles["CustomHeading1"]))
        if schema.preview:
            # Get column names
            headers = list(schema.preview[0].keys())
            preview_data = [headers]

            # Add up to 10 rows
            for row in schema.preview[:10]:
                preview_data.append([str(row[h])[:30] for h in headers])  # Limit cell width

            # Calculate column widths dynamically
            available_width = 6.5 * inch
            num_cols = len(headers)
            col_width = available_width / num_cols

            preview_table = Table(preview_data, colWidths=[col_width] * num_cols)
            preview_table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#10b981")),
                        ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                        ("FONTSIZE", (0, 0), (-1, 0), 8),
                        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
                        ("GRID", (0, 0), (-1, -1), 1, colors.grey),
                        ("FONTSIZE", (0, 1), (-1, -1), 7),
                        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
                    ]
                )
            )
            story.append(preview_table)
        story.append(Spacer(1, 0.3 * inch))

        # Charts Section
        story.append(PageBreak())
        story.append(Paragraph(f"📈 Generated Charts ({len(charts)})", styles["CustomHeading1"]))
        story.append(Spacer(1, 0.2 * inch))

        for i, chart in enumerate(charts, 1):
            # Chart header
            story.append(Paragraph(f"Chart {i}: {chart.title}", styles["CustomHeading2"]))
            story.append(
                Paragraph(
                    f"Type: {chart.chart_type.title()} | Data Points: {len(chart.data)}",
                    styles["CustomSmallText"],
                )
            )
            story.append(Spacer(1, 0.1 * inch))

            # Chart data summary
            data_summary = self._format_chart_data_summary(chart)
            story.append(Paragraph(f"<b>Data:</b> {data_summary}", styles["CustomBodyText"]))

            # AI Insight
            if chart.insight:
                story.append(Spacer(1, 0.1 * inch))
                insight_para = Paragraph(
                    f"<b>💡 AI Insight:</b> {chart.insight}", styles["CustomInsight"]
                )
                story.append(insight_para)

            story.append(Spacer(1, 0.3 * inch))

        # Footer
        story.append(PageBreak())
        story.append(
            Paragraph("Generated by Hikaru - AI Data Insight Board", styles["CustomFooter"])
        )
        story.append(Paragraph("Powered by Sanzoku Labs", styles["CustomFooter"]))

        # Build PDF
        doc.build(story)

        return export_id

    def _format_chart_data_summary(self, chart: ChartData) -> str:
        """Format chart data summary for PDF"""
        data_sample = chart.data[:5]  # First 5 data points

        if chart.chart_type == "pie":
            items = [f"{item['name']}: {item['value']:,.0f}" for item in data_sample]
            return " | ".join(items)
        elif chart.chart_type == "bar":
            items = [f"{item['category']}: {item['value']:,.0f}" for item in data_sample]
            return " | ".join(items)
        elif chart.chart_type == "line":
            items = [f"{item['x']}: {item['y']:,.0f}" for item in data_sample]
            return " | ".join(items[:3]) + "..."
        elif chart.chart_type == "scatter":
            return f"Showing {len(chart.data)} data points"

        return f"{len(chart.data)} data points"

    def _get_styles(self):
        """Return custom paragraph styles"""
        styles = getSampleStyleSheet()

        # Title style - use custom name to avoid conflicts
        styles.add(
            ParagraphStyle(
                name="CustomTitle",
                parent=styles["Heading1"],
                fontSize=24,
                textColor=colors.HexColor("#1e40af"),
                spaceAfter=6,
                alignment=TA_CENTER,
                fontName="Helvetica-Bold",
            )
        )

        # Subtitle style
        styles.add(
            ParagraphStyle(
                name="CustomSubtitle",
                parent=styles["Normal"],
                fontSize=10,
                textColor=colors.HexColor("#64748b"),
                spaceAfter=6,
                alignment=TA_CENTER,
            )
        )

        # Heading styles - use custom names to avoid conflicts
        styles.add(
            ParagraphStyle(
                name="CustomHeading1",
                parent=styles["Heading1"],
                fontSize=16,
                textColor=colors.HexColor("#1e40af"),
                spaceAfter=12,
                spaceBefore=12,
                fontName="Helvetica-Bold",
            )
        )

        styles.add(
            ParagraphStyle(
                name="CustomHeading2",
                parent=styles["Heading2"],
                fontSize=13,
                textColor=colors.HexColor("#475569"),
                spaceAfter=6,
                fontName="Helvetica-Bold",
            )
        )

        # Body text - use custom name to avoid conflicts
        styles.add(
            ParagraphStyle(name="CustomBodyText", parent=styles["Normal"], fontSize=10, leading=14)
        )

        # Small text
        styles.add(
            ParagraphStyle(
                name="CustomSmallText",
                parent=styles["Normal"],
                fontSize=8,
                textColor=colors.HexColor("#64748b"),
            )
        )

        # Insight style (highlighted)
        styles.add(
            ParagraphStyle(
                name="CustomInsight",
                parent=styles["Normal"],
                fontSize=9,
                textColor=colors.HexColor("#1e40af"),
                backColor=colors.HexColor("#eff6ff"),
                borderPadding=8,
                leftIndent=10,
                rightIndent=10,
            )
        )

        # Footer
        styles.add(
            ParagraphStyle(
                name="CustomFooter",
                parent=styles["Normal"],
                fontSize=9,
                textColor=colors.grey,
                alignment=TA_CENTER,
            )
        )

        return styles

    def get_export_path(self, export_id: str) -> str:
        """Get full path to exported PDF"""
        return os.path.join(self.export_dir, f"{export_id}.pdf")

    def cleanup_old_exports(self, max_age_hours: int = 1):
        """Delete exports older than specified hours"""
        import time

        now = time.time()
        cutoff = now - (max_age_hours * 3600)

        for filename in os.listdir(self.export_dir):
            filepath = os.path.join(self.export_dir, filename)
            if os.path.isfile(filepath) and os.path.getmtime(filepath) < cutoff:
                try:
                    os.remove(filepath)
                    logger.info(f"Deleted old export: {filename}")
                except Exception as e:
                    logger.warning(f"Failed to delete {filename}: {e}")
