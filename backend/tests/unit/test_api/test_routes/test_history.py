"""
Unit tests for history API routes (/api/history/*).

Tests cover:
- Get history (success, with filters, pagination)
- Server error handling
"""
import json
from datetime import datetime, timezone
from unittest.mock import Mock

import pytest
from fastapi import HTTPException, status

from app.api.routes.history import get_history


@pytest.fixture
def mock_user():
    user = Mock()
    user.id = 1
    user.email = "test@example.com"
    user.username = "testuser"
    user.is_active = True
    return user


@pytest.fixture
def sample_analysis():
    """Sample FileAnalysis mock."""
    analysis = Mock()
    analysis.id = 1
    analysis.file_id = 1
    analysis.user_intent = "Show trends"
    analysis.created_at = datetime.now(timezone.utc)
    analysis.analysis_json = json.dumps(
        {
            "charts": [
                {"chart_type": "line", "title": "Revenue", "insight": "Revenue is growing"},
            ],
            "global_summary": "Positive trends detected",
        }
    )
    return analysis


@pytest.fixture
def sample_file():
    """Sample File mock."""
    f = Mock()
    f.id = 1
    f.filename = "data.csv"
    return f


@pytest.fixture
def sample_project():
    """Sample Project mock."""
    p = Mock()
    p.id = 1
    p.name = "Test Project"
    p.user_id = 1
    return p


class FluentQueryMock:
    """A mock that supports fluent-style SQLAlchemy chaining and returns real values."""

    def __init__(self, results, total):
        self._results = results
        self._total = total

    def join(self, *args, **kwargs):
        return self

    def filter(self, *args, **kwargs):
        return self

    def order_by(self, *args, **kwargs):
        return self

    def offset(self, *args, **kwargs):
        return self

    def limit(self, *args, **kwargs):
        return self

    def count(self):
        return self._total

    def all(self):
        return self._results


def _make_mock_db(results, total):
    """Create a mock db where .query() returns a fluent mock."""
    db = Mock()
    db.query.return_value = FluentQueryMock(results, total)
    return db


# =============================================================================
# Test get_history endpoint
# =============================================================================


@pytest.mark.asyncio
async def test_get_history_success(mock_user, sample_analysis, sample_file, sample_project):
    """Test successfully retrieving history items."""
    results = [(sample_analysis, sample_file, sample_project)]
    mock_db = _make_mock_db(results, total=1)

    result = await get_history(
        page=1,
        page_size=20,
        current_user=mock_user,
        db=mock_db,
    )

    assert result.total == 1
    assert len(result.items) == 1
    assert result.items[0].filename == "data.csv"
    assert result.items[0].project_name == "Test Project"
    assert result.items[0].charts_count == 1
    assert result.items[0].first_insight == "Revenue is growing"
    assert result.has_more is False


@pytest.mark.asyncio
async def test_get_history_empty(mock_user):
    """Test history when user has no analyses."""
    mock_db = _make_mock_db(results=[], total=0)

    result = await get_history(
        page=1,
        page_size=20,
        current_user=mock_user,
        db=mock_db,
    )

    assert result.total == 0
    assert len(result.items) == 0
    assert result.has_more is False


@pytest.mark.asyncio
async def test_get_history_pagination(mock_user, sample_analysis, sample_file, sample_project):
    """Test history pagination (has_more flag)."""
    results = [(sample_analysis, sample_file, sample_project)]
    mock_db = _make_mock_db(results, total=25)

    result = await get_history(
        page=1,
        page_size=20,
        current_user=mock_user,
        db=mock_db,
    )

    assert result.total == 25
    assert result.page == 1
    assert result.page_size == 20
    assert result.has_more is True


@pytest.mark.asyncio
async def test_get_history_with_no_analysis_json(mock_user):
    """Test history item with no analysis JSON."""
    analysis = Mock()
    analysis.id = 2
    analysis.file_id = 1
    analysis.user_intent = None
    analysis.created_at = datetime.now(timezone.utc)
    analysis.analysis_json = None

    file_mock = Mock()
    file_mock.id = 1
    file_mock.filename = "empty.csv"

    project_mock = Mock()
    project_mock.id = 1
    project_mock.name = "Empty Project"
    project_mock.user_id = 1

    results = [(analysis, file_mock, project_mock)]
    mock_db = _make_mock_db(results, total=1)

    result = await get_history(
        page=1,
        page_size=20,
        current_user=mock_user,
        db=mock_db,
    )

    assert result.items[0].charts_count == 0
    assert result.items[0].first_insight is None


@pytest.mark.asyncio
async def test_get_history_server_error(mock_user):
    """Test history retrieval server error."""
    mock_db = Mock()
    mock_db.query.side_effect = Exception("Database connection lost")

    with pytest.raises(HTTPException) as exc_info:
        await get_history(
            page=1,
            page_size=20,
            current_user=mock_user,
            db=mock_db,
        )

    assert exc_info.value.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
