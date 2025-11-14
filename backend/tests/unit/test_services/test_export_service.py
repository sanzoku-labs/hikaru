"""
Unit tests for ExportService.

Tests PDF generation and export functionality.
"""
import os
import tempfile
import time
from unittest.mock import Mock, patch

import pytest

from app.models.schemas import ChartData, ColumnInfo, DataSchema
from app.services.export_service import ExportService


@pytest.fixture
def temp_export_dir(tmp_path):
    """Create temporary export directory"""
    export_dir = tmp_path / "exports"
    export_dir.mkdir()
    return str(export_dir)


@pytest.fixture
def export_service(temp_export_dir):
    """Create ExportService with temporary directory"""
    service = ExportService()
    service.export_dir = temp_export_dir
    return service


@pytest.fixture
def sample_schema():
    """Create sample data schema"""
    return DataSchema(
        columns=[
            ColumnInfo(
                name="date",
                type="datetime",
                unique_values=12,
                null_count=0,
                sample_values=["2024-01", "2024-02", "2024-03"],
            ),
            ColumnInfo(
                name="revenue",
                type="numeric",
                unique_values=12,
                null_count=0,
                sample_values=[1000, 1500, 2000],
                min=1000,
                max=5000,
                mean=2500,
                median=2400,
            ),
            ColumnInfo(
                name="region",
                type="categorical",
                unique_values=5,
                null_count=2,
                sample_values=["North", "South", "East"],
            ),
        ],
        row_count=60,
        preview=[
            {"date": "2024-01", "revenue": 1000, "region": "North"},
            {"date": "2024-02", "revenue": 1500, "region": "South"},
            {"date": "2024-03", "revenue": 2000, "region": "East"},
        ],
    )


@pytest.fixture
def sample_charts():
    """Create sample chart data"""
    return [
        ChartData(
            chart_type="line",
            title="Revenue Over Time",
            x_column="date",
            y_column="revenue",
            data=[
                {"x": "Jan", "y": 1000},
                {"x": "Feb", "y": 1500},
                {"x": "Mar", "y": 2000},
            ],
            priority=1,
            insight="Revenue shows steady growth over the period.",
        ),
        ChartData(
            chart_type="bar",
            title="Revenue by Region",
            x_column="region",
            y_column="revenue",
            data=[
                {"category": "North", "value": 5000},
                {"category": "South", "value": 7000},
                {"category": "East", "value": 6000},
            ],
            priority=2,
            insight="South region has the highest revenue.",
        ),
        ChartData(
            chart_type="pie",
            title="Revenue Distribution",
            category_column="region",
            value_column="revenue",
            data=[
                {"name": "North", "value": 5000},
                {"name": "South", "value": 7000},
                {"name": "East", "value": 6000},
            ],
            priority=3,
        ),
    ]


class TestExportServiceInitialization:
    """Test suite for ExportService initialization"""

    def test_creates_export_directory(self, tmp_path):
        """Test that export directory is created on initialization"""
        export_dir = tmp_path / "test_exports"

        service = ExportService()
        service.export_dir = str(export_dir)

        # Trigger directory creation
        os.makedirs(service.export_dir, exist_ok=True)

        assert os.path.exists(service.export_dir)
        assert os.path.isdir(service.export_dir)


class TestGeneratePDF:
    """Test suite for generate_pdf method"""

    def test_generates_pdf_successfully(
        self, export_service, sample_schema, sample_charts
    ):
        """Test successful PDF generation"""
        export_id = export_service.generate_pdf(
            filename="test_data.csv",
            schema=sample_schema,
            charts=sample_charts,
            global_summary="This is a test summary.",
        )

        # Verify export_id is returned
        assert export_id is not None
        assert isinstance(export_id, str)
        assert len(export_id) > 0

        # Verify PDF file exists
        pdf_path = export_service.get_export_path(export_id)
        assert os.path.exists(pdf_path)
        assert pdf_path.endswith(".pdf")

    def test_generates_pdf_without_global_summary(
        self, export_service, sample_schema, sample_charts
    ):
        """Test PDF generation without global summary"""
        export_id = export_service.generate_pdf(
            filename="test_data.csv",
            schema=sample_schema,
            charts=sample_charts,
            global_summary=None,
        )

        assert export_id is not None
        pdf_path = export_service.get_export_path(export_id)
        assert os.path.exists(pdf_path)

    def test_generates_pdf_with_empty_charts(
        self, export_service, sample_schema
    ):
        """Test PDF generation with empty charts list"""
        export_id = export_service.generate_pdf(
            filename="test_data.csv",
            schema=sample_schema,
            charts=[],
            global_summary="Summary without charts.",
        )

        assert export_id is not None
        pdf_path = export_service.get_export_path(export_id)
        assert os.path.exists(pdf_path)

    def test_handles_long_filename(
        self, export_service, sample_schema, sample_charts
    ):
        """Test PDF generation with very long filename"""
        long_filename = "a" * 200 + ".csv"

        export_id = export_service.generate_pdf(
            filename=long_filename,
            schema=sample_schema,
            charts=sample_charts,
        )

        assert export_id is not None
        pdf_path = export_service.get_export_path(export_id)
        assert os.path.exists(pdf_path)

    def test_handles_special_characters_in_filename(
        self, export_service, sample_schema, sample_charts
    ):
        """Test PDF generation with special characters in filename"""
        special_filename = "test_data_2024-01-01_région€.csv"

        export_id = export_service.generate_pdf(
            filename=special_filename,
            schema=sample_schema,
            charts=sample_charts,
        )

        assert export_id is not None
        pdf_path = export_service.get_export_path(export_id)
        assert os.path.exists(pdf_path)

    def test_generates_unique_export_ids(
        self, export_service, sample_schema, sample_charts
    ):
        """Test that each export gets unique ID"""
        export_id1 = export_service.generate_pdf(
            filename="test1.csv", schema=sample_schema, charts=sample_charts
        )
        export_id2 = export_service.generate_pdf(
            filename="test2.csv", schema=sample_schema, charts=sample_charts
        )

        assert export_id1 != export_id2

    def test_handles_many_columns(self, export_service, sample_charts):
        """Test PDF generation with many columns"""
        many_columns = [
            ColumnInfo(
                name=f"column_{i}",
                type="numeric" if i % 2 == 0 else "categorical",
                unique_values=10,
                null_count=0,
                sample_values=[i, i+1, i+2],  # Add required sample_values
            )
            for i in range(20)
        ]

        schema = DataSchema(
            columns=many_columns,
            row_count=1000,
            preview=[{f"column_{i}": i * 10 for i in range(20)}],
        )

        export_id = export_service.generate_pdf(
            filename="many_columns.csv",
            schema=schema,
            charts=sample_charts,
        )

        assert export_id is not None
        pdf_path = export_service.get_export_path(export_id)
        assert os.path.exists(pdf_path)

    def test_handles_large_preview_data(self, export_service, sample_charts):
        """Test PDF generation with large preview dataset"""
        large_preview = [
            {"col1": i, "col2": i * 10, "col3": f"row_{i}"}
            for i in range(100)
        ]

        schema = DataSchema(
            columns=[
                ColumnInfo(name="col1", type="numeric", unique_values=100, null_count=0, sample_values=[1, 2, 3]),
                ColumnInfo(name="col2", type="numeric", unique_values=100, null_count=0, sample_values=[10, 20, 30]),
                ColumnInfo(name="col3", type="categorical", unique_values=100, null_count=0, sample_values=["row_0", "row_1", "row_2"]),
            ],
            row_count=100,
            preview=large_preview,
        )

        export_id = export_service.generate_pdf(
            filename="large_preview.csv",
            schema=schema,
            charts=sample_charts,
        )

        assert export_id is not None
        pdf_path = export_service.get_export_path(export_id)
        assert os.path.exists(pdf_path)


class TestFormatChartDataSummary:
    """Test suite for _format_chart_data_summary method"""

    def test_formats_pie_chart_data(self, export_service):
        """Test formatting pie chart data summary"""
        chart = ChartData(
            chart_type="pie",
            title="Test Pie",
            category_column="region",
            value_column="revenue",
            data=[
                {"name": "North", "value": 5000},
                {"name": "South", "value": 7000},
                {"name": "East", "value": 6000},
            ],
            priority=1,
        )

        summary = export_service._format_chart_data_summary(chart)

        assert "North: 5,000" in summary
        assert "South: 7,000" in summary
        assert "East: 6,000" in summary

    def test_formats_bar_chart_data(self, export_service):
        """Test formatting bar chart data summary"""
        chart = ChartData(
            chart_type="bar",
            title="Test Bar",
            x_column="region",
            y_column="revenue",
            data=[
                {"category": "A", "value": 100},
                {"category": "B", "value": 200},
            ],
            priority=1,
        )

        summary = export_service._format_chart_data_summary(chart)

        assert "A: 100" in summary
        assert "B: 200" in summary

    def test_formats_line_chart_data(self, export_service):
        """Test formatting line chart data summary"""
        chart = ChartData(
            chart_type="line",
            title="Test Line",
            x_column="date",
            y_column="revenue",
            data=[
                {"x": "Jan", "y": 1000},
                {"x": "Feb", "y": 1500},
                {"x": "Mar", "y": 2000},
                {"x": "Apr", "y": 2500},
            ],
            priority=1,
        )

        summary = export_service._format_chart_data_summary(chart)

        assert "Jan: 1,000" in summary
        assert "..." in summary  # Shows truncation

    def test_formats_scatter_chart_data(self, export_service):
        """Test formatting scatter chart data summary"""
        chart = ChartData(
            chart_type="scatter",
            title="Test Scatter",
            x_column="x",
            y_column="y",
            data=[{"x": i, "y": i * 2} for i in range(50)],
            priority=1,
        )

        summary = export_service._format_chart_data_summary(chart)

        assert "50 data points" in summary

    def test_limits_data_points_in_summary(self, export_service):
        """Test that summary shows only first 5 data points"""
        chart = ChartData(
            chart_type="bar",
            title="Test Bar",
            x_column="category",
            y_column="value",
            data=[{"category": f"Cat{i}", "value": i * 100} for i in range(20)],
            priority=1,
        )

        summary = export_service._format_chart_data_summary(chart)

        # Should show first 5 categories
        assert "Cat0" in summary
        assert "Cat4" in summary
        # Should NOT show category 10 (beyond first 5)
        assert "Cat10" not in summary


class TestGetExportPath:
    """Test suite for get_export_path method"""

    def test_returns_correct_path(self, export_service):
        """Test that correct export path is returned"""
        export_id = "test-uuid-123"

        path = export_service.get_export_path(export_id)

        assert export_id in path
        assert path.endswith(".pdf")
        assert export_service.export_dir in path


class TestCleanupOldExports:
    """Test suite for cleanup_old_exports method"""

    def test_deletes_old_exports(self, export_service, sample_schema, sample_charts):
        """Test that old exports are deleted"""
        # Create an export
        export_id = export_service.generate_pdf(
            filename="test.csv", schema=sample_schema, charts=sample_charts
        )
        pdf_path = export_service.get_export_path(export_id)

        # Verify file exists
        assert os.path.exists(pdf_path)

        # Modify file timestamp to be old (2 hours ago)
        old_time = time.time() - (2 * 3600)
        os.utime(pdf_path, (old_time, old_time))

        # Run cleanup with 1 hour threshold
        export_service.cleanup_old_exports(max_age_hours=1)

        # Verify file is deleted
        assert not os.path.exists(pdf_path)

    def test_keeps_recent_exports(self, export_service, sample_schema, sample_charts):
        """Test that recent exports are not deleted"""
        # Create an export
        export_id = export_service.generate_pdf(
            filename="test.csv", schema=sample_schema, charts=sample_charts
        )
        pdf_path = export_service.get_export_path(export_id)

        # Verify file exists
        assert os.path.exists(pdf_path)

        # Run cleanup with 1 hour threshold (file is fresh)
        export_service.cleanup_old_exports(max_age_hours=1)

        # Verify file still exists
        assert os.path.exists(pdf_path)

    def test_handles_empty_directory(self, export_service):
        """Test cleanup on empty directory doesn't error"""
        # Should not raise error
        export_service.cleanup_old_exports(max_age_hours=1)

    def test_handles_cleanup_errors_gracefully(self, export_service, sample_schema, sample_charts):
        """Test that cleanup errors are logged but don't crash"""
        # Create an export
        export_id = export_service.generate_pdf(
            filename="test.csv", schema=sample_schema, charts=sample_charts
        )
        pdf_path = export_service.get_export_path(export_id)

        # Mock os.remove to raise exception
        with patch("os.remove", side_effect=Exception("Permission denied")):
            # Should not raise exception
            export_service.cleanup_old_exports(max_age_hours=0)

        # File should still exist (cleanup failed gracefully)
        assert os.path.exists(pdf_path)


class TestGetStyles:
    """Test suite for _get_styles method"""

    def test_returns_custom_styles(self, export_service):
        """Test that custom styles are created"""
        styles = export_service._get_styles()

        # Check for custom styles
        assert "CustomTitle" in styles
        assert "CustomSubtitle" in styles
        assert "CustomHeading1" in styles
        assert "CustomHeading2" in styles
        assert "CustomBodyText" in styles
        assert "CustomSmallText" in styles
        assert "CustomInsight" in styles
        assert "CustomFooter" in styles

    def test_styles_have_correct_properties(self, export_service):
        """Test that styles have expected properties"""
        styles = export_service._get_styles()

        # Check title style
        title_style = styles["CustomTitle"]
        assert title_style.fontSize == 24
        assert title_style.fontName == "Helvetica-Bold"

        # Check insight style
        insight_style = styles["CustomInsight"]
        assert insight_style.fontSize == 9
        assert insight_style.leftIndent == 10
