"""
Unit tests for reports API routes (/api/reports/*).

Tests cover:
- List report templates
- Generate report (success, value error, server error)
- List reports
- Download report (success, not found, ownership check)
- Delete report (success, not found)
"""
from datetime import datetime, timezone
from unittest.mock import Mock, patch

import pytest
from fastapi import HTTPException, status

from app.api.routes.reports import (
    delete_report,
    download_report,
    generate_report,
    list_reports,
    list_templates,
)
from app.models.schemas import (
    GeneratedReport,
    ReportGenerateRequest,
    ReportGenerateResponse,
    ReportListResponse,
)


@pytest.fixture
def mock_db():
    return Mock()


@pytest.fixture
def mock_user():
    user = Mock()
    user.id = 1
    user.email = "test@example.com"
    user.username = "testuser"
    user.is_active = True
    return user


@pytest.fixture
def sample_report():
    now = datetime.now(timezone.utc)
    return GeneratedReport(
        report_id="rpt-123",
        template_id="weekly_summary",
        template_name="Weekly Summary",
        title="Test Report",
        project_id=1,
        file_count=2,
        page_count=3,
        file_size=4096,
        download_url="/api/reports/rpt-123/download",
        created_at=now,
        expires_at=now,
    )


# =============================================================================
# Test list_templates endpoint
# =============================================================================


@pytest.mark.asyncio
async def test_list_templates_success(mock_user):
    """Test listing report templates."""
    result = await list_templates(current_user=mock_user)

    assert result.total > 0
    assert len(result.templates) > 0
    template_ids = [t.id for t in result.templates]
    assert "weekly_summary" in template_ids
    assert "executive_brief" in template_ids


# =============================================================================
# Test generate_report endpoint
# =============================================================================


@pytest.mark.asyncio
async def test_generate_report_success(mock_db, mock_user, sample_report):
    """Test successful report generation."""
    request = ReportGenerateRequest(
        template_id="weekly_summary",
        project_id=1,
    )
    mock_response = ReportGenerateResponse(
        report=sample_report,
        generation_time_ms=150,
    )

    with patch("app.api.routes.reports.ReportService") as mock_service_class:
        mock_service = Mock()
        mock_service.generate_report.return_value = mock_response
        mock_service_class.return_value = mock_service

        result = await generate_report(
            request=request,
            db=mock_db,
            current_user=mock_user,
        )

        assert result.report.report_id == "rpt-123"
        assert result.generation_time_ms == 150
        mock_service.generate_report.assert_called_once_with(
            user_id=mock_user.id,
            request=request,
        )


@pytest.mark.asyncio
async def test_generate_report_value_error(mock_db, mock_user):
    """Test report generation with invalid template."""
    request = ReportGenerateRequest(
        template_id="nonexistent_template",
        project_id=1,
    )

    with patch("app.api.routes.reports.ReportService") as mock_service_class:
        mock_service = Mock()
        mock_service.generate_report.side_effect = ValueError("Template not found")
        mock_service_class.return_value = mock_service

        with pytest.raises(HTTPException) as exc_info:
            await generate_report(
                request=request,
                db=mock_db,
                current_user=mock_user,
            )

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.asyncio
async def test_generate_report_server_error(mock_db, mock_user):
    """Test report generation with server error."""
    request = ReportGenerateRequest(
        template_id="weekly_summary",
        project_id=1,
    )

    with patch("app.api.routes.reports.ReportService") as mock_service_class:
        mock_service = Mock()
        mock_service.generate_report.side_effect = Exception("PDF generation failed")
        mock_service_class.return_value = mock_service

        with pytest.raises(HTTPException) as exc_info:
            await generate_report(
                request=request,
                db=mock_db,
                current_user=mock_user,
            )

        assert exc_info.value.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR


# =============================================================================
# Test list_reports endpoint
# =============================================================================


@pytest.mark.asyncio
async def test_list_reports_success(mock_db, mock_user, sample_report):
    """Test listing user's reports."""
    mock_response = ReportListResponse(reports=[sample_report], total=1)

    with patch("app.api.routes.reports.ReportService") as mock_service_class:
        mock_service = Mock()
        mock_service.list_reports.return_value = mock_response
        mock_service_class.return_value = mock_service

        result = await list_reports(
            db=mock_db,
            current_user=mock_user,
        )

        assert result.total == 1
        assert len(result.reports) == 1
        mock_service.list_reports.assert_called_once_with(user_id=mock_user.id)


@pytest.mark.asyncio
async def test_list_reports_empty(mock_db, mock_user):
    """Test listing reports when user has none."""
    mock_response = ReportListResponse(reports=[], total=0)

    with patch("app.api.routes.reports.ReportService") as mock_service_class:
        mock_service = Mock()
        mock_service.list_reports.return_value = mock_response
        mock_service_class.return_value = mock_service

        result = await list_reports(
            db=mock_db,
            current_user=mock_user,
        )

        assert result.total == 0
        assert result.reports == []


# =============================================================================
# Test download_report endpoint
# =============================================================================


@pytest.mark.asyncio
async def test_download_report_not_found_no_metadata(mock_db, mock_user, tmp_path):
    """Test downloading report when metadata file doesn't exist (ownership check)."""
    with patch("app.api.routes.reports.ReportService") as mock_service_class:
        mock_service = Mock()
        # Set reports_dir to tmp_path so metadata check fails
        mock_service.reports_dir = tmp_path
        mock_service_class.return_value = mock_service

        with pytest.raises(HTTPException) as exc_info:
            await download_report(
                report_id="rpt-999",
                db=mock_db,
                current_user=mock_user,
            )

        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_download_report_not_found_no_pdf(mock_db, mock_user, tmp_path):
    """Test downloading report when PDF doesn't exist."""
    # Create metadata file to pass ownership check
    metadata_dir = tmp_path / "metadata"
    metadata_dir.mkdir()
    metadata_file = metadata_dir / f"user_{mock_user.id}_rpt-123.json"
    metadata_file.write_text("{}")

    with patch("app.api.routes.reports.ReportService") as mock_service_class:
        mock_service = Mock()
        mock_service.reports_dir = tmp_path
        mock_service.get_report_path.return_value = None
        mock_service_class.return_value = mock_service

        with pytest.raises(HTTPException) as exc_info:
            await download_report(
                report_id="rpt-123",
                db=mock_db,
                current_user=mock_user,
            )

        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND


# =============================================================================
# Test delete_report endpoint
# =============================================================================


@pytest.mark.asyncio
async def test_delete_report_success(mock_db, mock_user):
    """Test successful report deletion."""
    with patch("app.api.routes.reports.ReportService") as mock_service_class:
        mock_service = Mock()
        mock_service.delete_report.return_value = True
        mock_service_class.return_value = mock_service

        result = await delete_report(
            report_id="rpt-123",
            db=mock_db,
            current_user=mock_user,
        )

        assert result is None
        mock_service.delete_report.assert_called_once_with(
            user_id=mock_user.id,
            report_id="rpt-123",
        )


@pytest.mark.asyncio
async def test_delete_report_not_found(mock_db, mock_user):
    """Test deleting non-existent report."""
    with patch("app.api.routes.reports.ReportService") as mock_service_class:
        mock_service = Mock()
        mock_service.delete_report.return_value = False
        mock_service_class.return_value = mock_service

        with pytest.raises(HTTPException) as exc_info:
            await delete_report(
                report_id="rpt-999",
                db=mock_db,
                current_user=mock_user,
            )

        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
