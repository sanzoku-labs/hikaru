"""
Unit tests for export API routes (/api/export, /api/download, /api/export-advanced).

Tests cover:
- PDF export generation from upload data
- Export download with authentication
- Advanced export with custom options (PDF, PNG, Excel)
- Error handling for missing files/exports
- Export cleanup and expiration
"""
from datetime import datetime
from unittest.mock import Mock, patch

import pandas as pd
import pytest
from fastapi import HTTPException

from app.api.routes.export import download_export, export_advanced, export_dashboard
from app.models.schemas import (
    AdvancedExportRequest,
    ChartData,
    ColumnInfo,
    DataSchema,
    ExportRequest,
)


@pytest.fixture
def mock_db():
    """Mock database session"""
    return Mock()


@pytest.fixture
def mock_user():
    """Mock authenticated user"""
    user = Mock()
    user.id = 1
    user.email = "test@example.com"
    user.is_active = True
    return user


@pytest.fixture
def sample_upload_data():
    """Sample upload data with DataFrame and schema"""
    df = pd.DataFrame(
        {
            "date": pd.date_range("2024-01-01", periods=10, freq="D"),
            "revenue": [100, 150, 200, 250, 300, 350, 400, 450, 500, 550],
            "category": ["A", "B", "A", "B", "A", "B", "A", "B", "A", "B"],
        }
    )

    schema = DataSchema(
        columns=[
            ColumnInfo(
                name="date",
                type="datetime",
                unique_values=10,
                null_count=0,
                sample_values=["2024-01-01", "2024-01-02"],
            ),
            ColumnInfo(
                name="revenue",
                type="numeric",
                unique_values=10,
                null_count=0,
                sample_values=[100, 150],
                min=100,
                max=550,
                mean=325,
                median=325,
            ),
            ColumnInfo(
                name="category",
                type="categorical",
                unique_values=2,
                null_count=0,
                sample_values=["A", "B"],
            ),
        ],
        row_count=10,
        preview=[],
    )

    return {
        "dataframe": df,
        "schema": schema,
        "filename": "test_data.csv",
        "timestamp": datetime.now().isoformat(),
    }


@pytest.fixture
def sample_charts():
    """Sample chart data"""
    return [
        ChartData(
            chart_type="line",
            title="Revenue Over Time",
            x_column="date",
            y_column="revenue",
            data=[{"x": "2024-01-01", "y": 100}, {"x": "2024-01-02", "y": 150}],
            priority=1,
            insight="Revenue shows steady growth trend.",
        ),
        ChartData(
            chart_type="bar",
            title="Revenue by Category",
            x_column="category",
            y_column="revenue",
            data=[{"x": "A", "y": 1500}, {"x": "B", "y": 2000}],
            priority=2,
        ),
    ]


# =============================================================================
# Test export_dashboard endpoint
# =============================================================================


@pytest.mark.asyncio
async def test_export_dashboard_success(mock_db, mock_user, sample_upload_data, sample_charts):
    """Test successful PDF export generation"""
    request = ExportRequest(upload_id="test-upload-123")

    with patch("app.api.routes.export.UploadService") as mock_upload_service_class:
        with patch("app.services.chart_generator.ChartGenerator") as mock_chart_generator_class:
            with patch("app.services.ai_service.AIService") as mock_ai_service_class:
                with patch("app.api.routes.export.ExportService") as mock_export_service_class:
                    # Setup UploadService mock
                    mock_upload_service = Mock()
                    mock_upload_service.get_upload.return_value = sample_upload_data
                    mock_upload_service_class.return_value = mock_upload_service

                    # Setup ChartGenerator mock
                    mock_chart_generator = Mock()
                    charts_data = [chart.model_dump() for chart in sample_charts]
                    mock_chart_generator.generate_charts.return_value = charts_data
                    mock_chart_generator_class.return_value = mock_chart_generator

                    # Setup AIService mock
                    mock_ai_service = Mock()
                    mock_ai_service.enabled = True
                    mock_ai_service.generate_chart_insight.return_value = "Test insight"
                    mock_ai_service.generate_global_summary.return_value = "Global summary"
                    mock_ai_service_class.return_value = mock_ai_service

                    # Setup ExportService mock
                    mock_export_service = Mock()
                    mock_export_service.generate_pdf.return_value = "export-123"
                    mock_export_service_class.return_value = mock_export_service

                    # Call endpoint
                    result = await export_dashboard(
                        request=request,
                        db=mock_db,
                        current_user=mock_user,
                    )

                    # Verify result
                    assert result.export_id == "export-123"
                    assert result.download_url == "/api/download/export-123"
                    assert result.filename == "export-123.pdf"
                    assert result.generated_at is not None

                    # Verify services were called
                    mock_upload_service.get_upload.assert_called_once_with("test-upload-123")
                    mock_chart_generator.generate_charts.assert_called_once()
                    mock_export_service.generate_pdf.assert_called_once()
                    mock_export_service.cleanup_old_exports.assert_called_once_with(max_age_hours=1)


@pytest.mark.asyncio
async def test_export_dashboard_without_ai(mock_db, mock_user, sample_upload_data, sample_charts):
    """Test PDF export when AI is disabled"""
    request = ExportRequest(upload_id="test-upload-123")

    with patch("app.api.routes.export.UploadService") as mock_upload_service_class:
        with patch("app.services.chart_generator.ChartGenerator") as mock_chart_generator_class:
            with patch("app.services.ai_service.AIService") as mock_ai_service_class:
                with patch("app.api.routes.export.ExportService") as mock_export_service_class:
                    # Setup mocks
                    mock_upload_service = Mock()
                    mock_upload_service.get_upload.return_value = sample_upload_data
                    mock_upload_service_class.return_value = mock_upload_service

                    mock_chart_generator = Mock()
                    charts_data = [chart.model_dump() for chart in sample_charts]
                    mock_chart_generator.generate_charts.return_value = charts_data
                    mock_chart_generator_class.return_value = mock_chart_generator

                    # AI disabled
                    mock_ai_service = Mock()
                    mock_ai_service.enabled = False
                    mock_ai_service_class.return_value = mock_ai_service

                    mock_export_service = Mock()
                    mock_export_service.generate_pdf.return_value = "export-456"
                    mock_export_service_class.return_value = mock_export_service

                    # Call endpoint
                    result = await export_dashboard(
                        request=request,
                        db=mock_db,
                        current_user=mock_user,
                    )

                    # Verify result
                    assert result.export_id == "export-456"

                    # Verify AI service was not called for insights
                    mock_ai_service.generate_chart_insight.assert_not_called()
                    mock_ai_service.generate_global_summary.assert_not_called()


@pytest.mark.asyncio
async def test_export_dashboard_ai_failure_graceful(
    mock_db, mock_user, sample_upload_data, sample_charts
):
    """Test that export continues even if AI fails"""
    request = ExportRequest(upload_id="test-upload-123")

    with patch("app.api.routes.export.UploadService") as mock_upload_service_class:
        with patch("app.services.chart_generator.ChartGenerator") as mock_chart_generator_class:
            with patch("app.services.ai_service.AIService") as mock_ai_service_class:
                with patch("app.api.routes.export.ExportService") as mock_export_service_class:
                    # Setup mocks
                    mock_upload_service = Mock()
                    mock_upload_service.get_upload.return_value = sample_upload_data
                    mock_upload_service_class.return_value = mock_upload_service

                    mock_chart_generator = Mock()
                    charts_data = [chart.model_dump() for chart in sample_charts]
                    mock_chart_generator.generate_charts.return_value = charts_data
                    mock_chart_generator_class.return_value = mock_chart_generator

                    # AI enabled but fails
                    mock_ai_service = Mock()
                    mock_ai_service.enabled = True
                    mock_ai_service.generate_chart_insight.side_effect = Exception("AI API error")
                    mock_ai_service_class.return_value = mock_ai_service

                    mock_export_service = Mock()
                    mock_export_service.generate_pdf.return_value = "export-789"
                    mock_export_service_class.return_value = mock_export_service

                    # Call endpoint - should not raise exception
                    result = await export_dashboard(
                        request=request,
                        db=mock_db,
                        current_user=mock_user,
                    )

                    # Verify export still succeeded
                    assert result.export_id == "export-789"
                    mock_export_service.generate_pdf.assert_called_once()


# =============================================================================
# Test download_export endpoint
# =============================================================================


@pytest.mark.asyncio
async def test_download_export_success(mock_user):
    """Test successful export download"""
    export_id = "test-export-123"

    with patch("app.api.routes.export.ExportService") as mock_export_service_class:
        with patch("app.api.routes.export.os.path.exists", return_value=True):
            with patch("app.api.routes.export.FileResponse") as mock_file_response:
                # Setup mock
                mock_export_service = Mock()
                mock_export_service.get_export_path.return_value = "/exports/test-export-123.pdf"
                mock_export_service_class.return_value = mock_export_service

                # Call endpoint
                result = await download_export(
                    export_id=export_id,
                    current_user=mock_user,
                )

                # Verify FileResponse was called
                mock_file_response.assert_called_once_with(
                    "/exports/test-export-123.pdf",
                    media_type="application/pdf",
                    filename="hikaru-dashboard-test-exp.pdf",
                )


@pytest.mark.asyncio
async def test_download_export_not_found(mock_user):
    """Test download when export doesn't exist"""
    export_id = "nonexistent-export"

    with patch("app.api.routes.export.ExportService") as mock_export_service_class:
        with patch("app.api.routes.export.os.path.exists", return_value=False):
            # Setup mock
            mock_export_service = Mock()
            mock_export_service.get_export_path.return_value = "/exports/nonexistent.pdf"
            mock_export_service_class.return_value = mock_export_service

            # Should raise HTTPException
            with pytest.raises(HTTPException) as exc_info:
                await download_export(
                    export_id=export_id,
                    current_user=mock_user,
                )

            assert exc_info.value.status_code == 404
            assert "Export not found or has expired" in str(exc_info.value.detail)


# =============================================================================
# Test export_advanced endpoint
# =============================================================================


@pytest.mark.asyncio
async def test_export_advanced_with_file_id(mock_db, mock_user, sample_charts):
    """Test advanced export with file_id"""
    request = AdvancedExportRequest(
        file_id=1,
        export_format="pdf",
        include_charts=True,
        include_insights=True,
        include_summary=True,
        custom_title="Custom Report",
    )

    with patch("app.api.routes.export.ExportService") as mock_export_service_class:
        with patch("app.api.routes.export.os.path.getsize", return_value=102400):
            with patch("app.api.routes.export.os.path.exists", return_value=True):
                # Setup mock file and project
                mock_file = Mock()
                mock_file.id = 1
                mock_file.filename = "test_file.csv"
                mock_file.project_id = 1
                mock_file.analysis_json = '{"charts": [], "global_summary": "Test summary", "schema": {"columns": [], "row_count": 10, "preview": []}}'

                mock_project = Mock()
                mock_project.id = 1
                mock_project.user_id = 1

                # Setup db query mocks
                mock_db.query.return_value.filter.return_value.first.side_effect = [
                    mock_file,
                    mock_project,
                ]

                # Setup ExportService mock
                mock_export_service = Mock()
                mock_export_service.generate_pdf.return_value = "advanced-export-123"
                mock_export_service.get_export_path.return_value = (
                    "/exports/advanced-export-123.pdf"
                )
                mock_export_service_class.return_value = mock_export_service

                # Call endpoint
                result = await export_advanced(
                    request=request,
                    current_user=mock_user,
                    db=mock_db,
                )

                # Verify result
                assert result.export_id == "advanced-export-123"
                assert result.export_format == "pdf"
                assert result.file_size == 102400
                assert "Custom Report" in str(mock_export_service.generate_pdf.call_args)


@pytest.mark.asyncio
async def test_export_advanced_with_upload_id(
    mock_db, mock_user, sample_upload_data, sample_charts
):
    """Test advanced export with upload_id (legacy support)"""
    request = AdvancedExportRequest(
        upload_id="upload-123",
        export_format="excel",
        include_charts=True,
        include_insights=False,
        custom_filename="my-export",
    )

    with patch("app.api.routes.export.UploadService") as mock_upload_service_class:
        with patch("app.services.chart_generator.ChartGenerator") as mock_chart_generator_class:
            with patch("app.api.routes.export.ExportService") as mock_export_service_class:
                with patch("app.api.routes.export.os.path.getsize", return_value=204800):
                    with patch("app.api.routes.export.os.path.exists", return_value=True):
                        # Setup mocks
                        mock_upload_service = Mock()
                        mock_upload_service.get_upload.return_value = sample_upload_data
                        mock_upload_service_class.return_value = mock_upload_service

                        mock_chart_generator = Mock()
                        charts_data = [chart.model_dump() for chart in sample_charts]
                        mock_chart_generator.generate_charts.return_value = charts_data
                        mock_chart_generator_class.return_value = mock_chart_generator

                        mock_export_service = Mock()
                        mock_export_service.generate_pdf.return_value = "excel-export-456"
                        mock_export_service.get_export_path.return_value = (
                            "/exports/excel-export-456.pdf"
                        )
                        mock_export_service_class.return_value = mock_export_service

                        # Call endpoint
                        result = await export_advanced(
                            request=request,
                            current_user=mock_user,
                            db=mock_db,
                        )

                        # Verify result
                        assert result.export_id == "excel-export-456"
                        assert result.export_format == "excel"
                        assert result.filename == "my-export.xlsx"
                        assert result.file_size == 204800


@pytest.mark.asyncio
async def test_export_advanced_missing_ids(mock_db, mock_user):
    """Test advanced export with no file/upload/project ID"""
    request = AdvancedExportRequest(
        export_format="pdf",
        include_charts=True,
    )

    # Should raise HTTPException
    with pytest.raises(HTTPException) as exc_info:
        await export_advanced(
            request=request,
            current_user=mock_user,
            db=mock_db,
        )

    assert exc_info.value.status_code == 400
    assert "Must provide file_id, project_id, or upload_id" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_export_advanced_file_not_found(mock_db, mock_user):
    """Test advanced export when file doesn't exist"""
    request = AdvancedExportRequest(
        file_id=999,
        export_format="pdf",
    )

    # Setup db query to return None
    mock_db.query.return_value.filter.return_value.first.return_value = None

    # Should raise HTTPException
    with pytest.raises(HTTPException) as exc_info:
        await export_advanced(
            request=request,
            current_user=mock_user,
            db=mock_db,
        )

    assert exc_info.value.status_code == 404
    assert "File not found" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_export_advanced_file_not_analyzed(mock_db, mock_user):
    """Test advanced export when file hasn't been analyzed"""
    request = AdvancedExportRequest(
        file_id=1,
        export_format="pdf",
    )

    # Setup mock file with no analysis
    mock_file = Mock()
    mock_file.id = 1
    mock_file.filename = "test_file.csv"
    mock_file.project_id = 1
    mock_file.analysis_json = None  # No analysis

    mock_project = Mock()
    mock_project.id = 1
    mock_project.user_id = 1

    mock_db.query.return_value.filter.return_value.first.side_effect = [mock_file, mock_project]

    # Should raise HTTPException
    with pytest.raises(HTTPException) as exc_info:
        await export_advanced(
            request=request,
            current_user=mock_user,
            db=mock_db,
        )

    assert exc_info.value.status_code == 400
    assert "File has not been analyzed yet" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_export_advanced_custom_options(
    mock_db, mock_user, sample_upload_data, sample_charts
):
    """Test advanced export with custom content selection"""
    request = AdvancedExportRequest(
        upload_id="upload-123",
        export_format="pdf",
        include_charts=False,  # Exclude charts
        include_insights=False,  # Exclude insights
        include_summary=False,  # Exclude summary
    )

    with patch("app.api.routes.export.UploadService") as mock_upload_service_class:
        with patch("app.services.chart_generator.ChartGenerator") as mock_chart_generator_class:
            with patch("app.api.routes.export.ExportService") as mock_export_service_class:
                with patch("app.api.routes.export.os.path.getsize", return_value=51200):
                    with patch("app.api.routes.export.os.path.exists", return_value=True):
                        # Setup mocks
                        mock_upload_service = Mock()
                        mock_upload_service.get_upload.return_value = sample_upload_data
                        mock_upload_service_class.return_value = mock_upload_service

                        mock_chart_generator = Mock()
                        charts_data = [chart.model_dump() for chart in sample_charts]
                        mock_chart_generator.generate_charts.return_value = charts_data
                        mock_chart_generator_class.return_value = mock_chart_generator

                        mock_export_service = Mock()
                        mock_export_service.generate_pdf.return_value = "minimal-export-789"
                        mock_export_service.get_export_path.return_value = (
                            "/exports/minimal-export-789.pdf"
                        )
                        mock_export_service_class.return_value = mock_export_service

                        # Call endpoint
                        result = await export_advanced(
                            request=request,
                            current_user=mock_user,
                            db=mock_db,
                        )

                        # Verify generate_pdf was called with empty charts list
                        call_kwargs = mock_export_service.generate_pdf.call_args[1]
                        assert call_kwargs["charts"] == []
                        assert call_kwargs["global_summary"] is None
