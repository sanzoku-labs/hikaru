"""
Unit tests for ReportService.

Tests cover:
- Template listing and retrieval
- Report generation (success, invalid template, no data)
- Report listing (empty, with reports, expired cleanup)
- Report deletion (success, not found)
- Metadata file naming consistency (bug fix verification)
"""
import json
from datetime import datetime, timedelta, timezone
from unittest.mock import Mock, patch

import pytest

from app.models.schemas import GeneratedReport, ReportGenerateRequest
from app.services.report_service import REPORT_TEMPLATES, ReportService


@pytest.fixture
def mock_db():
    return Mock()


@pytest.fixture
def service(mock_db, tmp_path):
    """Create ReportService with a temp directory for reports."""
    with patch("app.services.report_service.settings") as mock_settings:
        mock_settings.upload_dir = str(tmp_path)
        svc = ReportService(mock_db)
        svc.reports_dir = tmp_path / "reports"
        svc.reports_dir.mkdir(parents=True, exist_ok=True)
    return svc


# =============================================================================
# Test template operations
# =============================================================================


def test_list_templates(service):
    """Test listing all templates."""
    result = service.list_templates()

    assert result.total == len(REPORT_TEMPLATES)
    assert len(result.templates) == len(REPORT_TEMPLATES)


def test_get_template_found(service):
    """Test getting an existing template."""
    result = service.get_template("weekly_summary")

    assert result is not None
    assert result.id == "weekly_summary"
    assert result.name == "Weekly Summary"


def test_get_template_not_found(service):
    """Test getting a non-existent template."""
    result = service.get_template("nonexistent")

    assert result is None


# =============================================================================
# Test report generation
# =============================================================================


def test_generate_report_invalid_template(service):
    """Test generating report with invalid template ID."""
    request = ReportGenerateRequest(
        template_id="nonexistent",
        project_id=1,
    )

    with pytest.raises(ValueError, match="Template.*not found"):
        service.generate_report(user_id=1, request=request)


def test_generate_report_no_data(service, mock_db):
    """Test generating report when no files match."""
    request = ReportGenerateRequest(
        template_id="weekly_summary",
        project_id=999,
    )

    # Mock project query to return None
    mock_db.query.return_value.filter.return_value.first.return_value = None

    with pytest.raises(ValueError, match="No data found"):
        service.generate_report(user_id=1, request=request)


# =============================================================================
# Test metadata naming consistency (bug fix)
# =============================================================================


def test_save_report_metadata_naming(service):
    """Verify metadata is saved as user_{uid}_{report_id}.json (bug fix)."""
    now = datetime.now(timezone.utc)
    report = GeneratedReport(
        report_id="test-report-id",
        template_id="weekly_summary",
        template_name="Weekly Summary",
        title="Test Report",
        file_count=1,
        page_count=2,
        file_size=1024,
        download_url="/api/reports/test-report-id/download",
        created_at=now,
        expires_at=now + timedelta(hours=24),
    )

    service._save_report_metadata(user_id=42, report=report)

    metadata_dir = service.reports_dir / "metadata"
    expected_file = metadata_dir / "user_42_test-report-id.json"
    assert expected_file.exists()

    # Old naming should NOT exist
    old_file = metadata_dir / "report_test-report-id.json"
    assert not old_file.exists()

    # Verify content
    with open(expected_file) as f:
        data = json.load(f)
    assert data["report_id"] == "test-report-id"


# =============================================================================
# Test report listing
# =============================================================================


def test_list_reports_empty(service):
    """Test listing reports when none exist."""
    result = service.list_reports(user_id=1)

    assert result.total == 0
    assert result.reports == []


def test_list_reports_with_valid_report(service):
    """Test listing reports with a valid non-expired report."""
    now = datetime.now(timezone.utc)
    report = GeneratedReport(
        report_id="rpt-abc",
        template_id="weekly_summary",
        template_name="Weekly Summary",
        title="My Report",
        file_count=1,
        page_count=2,
        file_size=2048,
        download_url="/api/reports/rpt-abc/download",
        created_at=now,
        expires_at=now + timedelta(hours=24),
    )

    service._save_report_metadata(user_id=1, report=report)

    result = service.list_reports(user_id=1)

    assert result.total == 1
    assert result.reports[0].report_id == "rpt-abc"


def test_list_reports_filters_by_user(service):
    """Test that list_reports only returns reports for the given user."""
    now = datetime.now(timezone.utc)
    report = GeneratedReport(
        report_id="rpt-user2",
        template_id="weekly_summary",
        template_name="Weekly Summary",
        title="User 2 Report",
        file_count=1,
        page_count=1,
        file_size=512,
        download_url="/api/reports/rpt-user2/download",
        created_at=now,
        expires_at=now + timedelta(hours=24),
    )

    service._save_report_metadata(user_id=2, report=report)

    # User 1 should see no reports
    result = service.list_reports(user_id=1)
    assert result.total == 0

    # User 2 should see the report
    result = service.list_reports(user_id=2)
    assert result.total == 1


# =============================================================================
# Test report deletion
# =============================================================================


def test_delete_report_success(service):
    """Test successful report deletion."""
    now = datetime.now(timezone.utc)
    report = GeneratedReport(
        report_id="rpt-del",
        template_id="weekly_summary",
        template_name="Weekly Summary",
        title="Delete Me",
        file_count=1,
        page_count=1,
        file_size=512,
        download_url="/api/reports/rpt-del/download",
        created_at=now,
        expires_at=now + timedelta(hours=24),
    )

    service._save_report_metadata(user_id=1, report=report)

    # Create fake PDF
    pdf_path = service.reports_dir / "rpt-del.pdf"
    pdf_path.write_text("fake pdf")

    result = service.delete_report(user_id=1, report_id="rpt-del")

    assert result is True
    assert not pdf_path.exists()


def test_delete_report_not_found(service):
    """Test deleting non-existent report."""
    result = service.delete_report(user_id=1, report_id="nonexistent")

    assert result is False


def test_delete_report_wrong_user(service):
    """Test that user can't delete another user's report."""
    now = datetime.now(timezone.utc)
    report = GeneratedReport(
        report_id="rpt-other",
        template_id="weekly_summary",
        template_name="Weekly Summary",
        title="Other User's Report",
        file_count=1,
        page_count=1,
        file_size=512,
        download_url="/api/reports/rpt-other/download",
        created_at=now,
        expires_at=now + timedelta(hours=24),
    )

    service._save_report_metadata(user_id=2, report=report)

    # User 1 should not be able to delete user 2's report
    result = service.delete_report(user_id=1, report_id="rpt-other")

    assert result is False


# =============================================================================
# Test get_report_path
# =============================================================================


def test_get_report_path_exists(service):
    """Test getting path for existing report."""
    pdf_path = service.reports_dir / "rpt-123.pdf"
    pdf_path.write_text("fake pdf content")

    result = service.get_report_path("rpt-123")

    assert result == pdf_path


def test_get_report_path_not_found(service):
    """Test getting path for non-existent report."""
    result = service.get_report_path("nonexistent")

    assert result is None
