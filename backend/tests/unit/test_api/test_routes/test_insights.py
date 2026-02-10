"""
Unit tests for chart insights API routes (/api/charts/insight).

Tests cover:
- Generate chart insight (success, cached, file not found, permission denied, AI unavailable)
"""
import json
from datetime import datetime, timezone
from unittest.mock import Mock, patch

import pytest
from fastapi import HTTPException
from starlette.requests import Request

from app.api.routes.insights import compute_chart_hash, generate_chart_insight
from app.models.schemas import ChartInsightRequest


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
def sample_request():
    return ChartInsightRequest(
        file_id=1,
        chart_type="line",
        chart_title="Revenue Over Time",
        chart_data=[{"x": "Jan", "y": 100}, {"x": "Feb", "y": 200}],
        x_column="month",
        y_column="revenue",
    )


@pytest.fixture
def mock_file():
    """Mock file with project access."""
    file = Mock()
    file.id = 1
    file.project = Mock()
    file.project.user_id = 1
    file.schema_json = json.dumps(
        {
            "columns": [
                {"name": "month", "type": "categorical", "null_count": 0, "sample_values": ["Jan"]},
                {
                    "name": "revenue",
                    "type": "numeric",
                    "null_count": 0,
                    "sample_values": [100],
                    "min": 100,
                    "max": 200,
                    "mean": 150,
                    "median": 150,
                },
            ],
            "row_count": 12,
            "preview": [],
        }
    )
    return file


# =============================================================================
# Test compute_chart_hash
# =============================================================================


def test_compute_chart_hash_deterministic(sample_request):
    """Test that hash is deterministic for same input."""
    hash1 = compute_chart_hash(sample_request)
    hash2 = compute_chart_hash(sample_request)
    assert hash1 == hash2
    assert len(hash1) == 32  # MD5 hex digest length


def test_compute_chart_hash_differs_for_different_input():
    """Test that hash differs for different chart data."""
    req1 = ChartInsightRequest(
        file_id=1,
        chart_type="line",
        chart_title="Chart A",
        chart_data=[{"x": 1, "y": 2}],
    )
    req2 = ChartInsightRequest(
        file_id=1,
        chart_type="bar",
        chart_title="Chart B",
        chart_data=[{"x": 3, "y": 4}],
    )
    assert compute_chart_hash(req1) != compute_chart_hash(req2)


# =============================================================================
# Test generate_chart_insight endpoint
# =============================================================================


@pytest.mark.asyncio
async def test_generate_insight_cached(mock_db, mock_user, sample_request, mock_file):
    """Test returning cached insight from database."""
    now = datetime.now(timezone.utc)

    # Setup file query
    mock_db.query.return_value.filter.return_value.first.return_value = mock_file

    # Setup cached insight
    existing_insight = Mock()
    existing_insight.insight = "Revenue shows steady growth."
    existing_insight.insight_type = "advanced"
    existing_insight.chart_hash = "abc123"
    existing_insight.generated_at = now
    existing_insight.model_version = "claude-sonnet-4-20250514"

    # File query returns file, ChartInsight query returns cached
    def mock_query(model):
        q = Mock()
        if model.__name__ == "File":
            q.filter.return_value.first.return_value = mock_file
        else:
            q.filter.return_value.first.return_value = existing_insight
        return q

    mock_db.query.side_effect = mock_query

    result = await generate_chart_insight(
        request=Mock(spec=Request),
        body=sample_request,
        db=mock_db,
        current_user=mock_user,
    )

    assert result.cached is True
    assert result.insight == "Revenue shows steady growth."


@pytest.mark.asyncio
async def test_generate_insight_file_not_found(mock_db, mock_user, sample_request):
    """Test insight generation with non-existent file."""
    mock_db.query.return_value.filter.return_value.first.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        await generate_chart_insight(
            request=Mock(spec=Request),
            body=sample_request,
            db=mock_db,
            current_user=mock_user,
        )

    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_generate_insight_permission_denied(mock_db, mock_user, sample_request):
    """Test insight generation when user doesn't own the file's project."""
    file = Mock()
    file.id = 1
    file.project = Mock()
    file.project.user_id = 999  # Different user

    mock_db.query.return_value.filter.return_value.first.return_value = file

    with pytest.raises(HTTPException) as exc_info:
        await generate_chart_insight(
            request=Mock(spec=Request),
            body=sample_request,
            db=mock_db,
            current_user=mock_user,
        )

    assert exc_info.value.status_code == 403


@pytest.mark.asyncio
async def test_generate_insight_new(mock_db, mock_user, sample_request, mock_file):
    """Test generating a new insight (not cached)."""

    def mock_query(model):
        q = Mock()
        if model.__name__ == "File":
            q.filter.return_value.first.return_value = mock_file
        else:
            # ChartInsight - no cached entry
            q.filter.return_value.first.return_value = None
        return q

    mock_db.query.side_effect = mock_query

    with patch("app.api.routes.insights.AIInsightService") as mock_ai_class:
        mock_ai = Mock()
        mock_ai.generate_advanced_chart_insight.return_value = "AI generated insight text."
        mock_ai_class.return_value = mock_ai

        result = await generate_chart_insight(
            request=Mock(spec=Request),
            body=sample_request,
            db=mock_db,
            current_user=mock_user,
        )

        assert result.cached is False
        assert result.insight == "AI generated insight text."
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()


@pytest.mark.asyncio
async def test_generate_insight_ai_unavailable(mock_db, mock_user, sample_request, mock_file):
    """Test when AI service returns no insight."""

    def mock_query(model):
        q = Mock()
        if model.__name__ == "File":
            q.filter.return_value.first.return_value = mock_file
        else:
            q.filter.return_value.first.return_value = None
        return q

    mock_db.query.side_effect = mock_query

    with patch("app.api.routes.insights.AIInsightService") as mock_ai_class:
        mock_ai = Mock()
        mock_ai.generate_advanced_chart_insight.return_value = None
        mock_ai_class.return_value = mock_ai

        with pytest.raises(HTTPException) as exc_info:
            await generate_chart_insight(
                request=Mock(spec=Request),
                body=sample_request,
                db=mock_db,
                current_user=mock_user,
            )

        assert exc_info.value.status_code == 503
