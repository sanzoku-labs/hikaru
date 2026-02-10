"""
Unit tests for analytics API routes (/api/analytics).

Tests cover:
- Analytics dashboard metrics calculation
- Trend calculations (current vs previous period)
- Recent analyses listing
- Chart type distribution
- Top insights extraction
- Error handling
"""
from datetime import datetime, timedelta, timezone
from unittest.mock import Mock

import pytest
from fastapi import HTTPException, status

from app.api.routes.analytics import get_analytics


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


# =============================================================================
# Test get_analytics endpoint
# =============================================================================


@pytest.mark.asyncio
async def test_get_analytics_success(mock_db, mock_user):
    """Test successful analytics retrieval with data"""
    # Mock query chains for counts
    mock_query = Mock()

    # Setup count mocks for different queries
    count_values = [
        5,  # total_projects
        20,  # total_files
        15,  # total_analyses
        2,  # current_projects
        1,  # previous_projects
        8,  # current_files
        5,  # previous_files
        6,  # current_analyses
        4,  # previous_analyses
    ]

    mock_query.count.side_effect = count_values
    mock_query.filter.return_value = mock_query
    mock_query.join.return_value = mock_query
    mock_db.query.return_value = mock_query

    # Mock recent analyses
    recent_file1 = Mock()
    recent_file1.id = 1
    recent_file1.filename = "sales.csv"
    recent_file1.analysis_timestamp = datetime.now(timezone.utc) - timedelta(hours=1)
    recent_file1.project_id = 1
    recent_file1.schema_json = '{"columns": [], "row_count": 100, "preview": []}'
    recent_file1.analysis_json = '{"charts": [], "global_summary": "Test summary"}'

    recent_project1 = Mock()
    recent_project1.id = 1
    recent_project1.name = "Project A"

    # For all() call (recent analyses) - must return list of tuples (file, project)
    mock_query.all.return_value = [(recent_file1, recent_project1)]

    # For order_by, limit calls
    mock_query.order_by.return_value = mock_query
    mock_query.limit.return_value = mock_query

    # Call endpoint
    result = await get_analytics(
        current_user=mock_user,
        db=mock_db,
    )

    # Verify basic counts
    assert result.total_projects == 5
    assert result.total_files == 20
    assert result.total_analyses == 15

    # Verify trends are calculated
    assert result.projects_trend == 100.0  # (2-1)/1 * 100
    assert result.files_trend == 60.0  # (8-5)/5 * 100
    assert result.analyses_trend == 50.0  # (6-4)/4 * 100

    # Verify recent analyses
    assert len(result.recent_analyses) == 1
    assert result.recent_analyses[0].filename == "sales.csv"


@pytest.mark.asyncio
async def test_get_analytics_empty_account(mock_db, mock_user):
    """Test analytics for user with no data"""
    # Mock query chains - all counts return 0
    mock_query = Mock()
    mock_query.count.return_value = 0
    mock_query.all.return_value = []
    mock_query.filter.return_value = mock_query
    mock_query.join.return_value = mock_query
    mock_query.order_by.return_value = mock_query
    mock_query.limit.return_value = mock_query
    mock_db.query.return_value = mock_query

    # Call endpoint
    result = await get_analytics(
        current_user=mock_user,
        db=mock_db,
    )

    # Verify all zeros
    assert result.total_projects == 0
    assert result.total_files == 0
    assert result.total_analyses == 0
    assert result.projects_trend == 0.0
    assert result.files_trend == 0.0
    assert result.analyses_trend == 0.0
    assert len(result.recent_analyses) == 0


@pytest.mark.asyncio
async def test_get_analytics_no_previous_period_data(mock_db, mock_user):
    """Test analytics when there's current data but no previous period data"""
    mock_query = Mock()

    # Current period has data, previous period has none
    count_values = [
        3,  # total_projects
        10,  # total_files
        8,  # total_analyses
        3,  # current_projects
        0,  # previous_projects (no previous data)
        10,  # current_files
        0,  # previous_files (no previous data)
        8,  # current_analyses
        0,  # previous_analyses (no previous data)
    ]

    mock_query.count.side_effect = count_values
    mock_query.filter.return_value = mock_query
    mock_query.join.return_value = mock_query
    mock_query.order_by.return_value = mock_query
    mock_query.limit.return_value = mock_query
    mock_query.all.return_value = []
    mock_db.query.return_value = mock_query

    # Call endpoint
    result = await get_analytics(
        current_user=mock_user,
        db=mock_db,
    )

    # When previous period is 0 but current has data, trend should be 100%
    assert result.projects_trend == 100.0
    assert result.files_trend == 100.0
    assert result.analyses_trend == 100.0


@pytest.mark.asyncio
async def test_get_analytics_with_chart_distribution(mock_db, mock_user):
    """Test analytics with chart type distribution"""
    mock_query = Mock()

    # Setup basic counts
    count_values = [
        1,  # total_projects
        3,  # total_files
        3,  # total_analyses
        1,  # current_projects
        0,  # previous_projects
        3,  # current_files
        0,  # previous_files
        3,  # current_analyses
        0,  # previous_analyses
    ]

    mock_query.count.side_effect = count_values
    mock_query.filter.return_value = mock_query
    mock_query.join.return_value = mock_query

    # Mock files with analysis_json containing charts
    file1 = Mock()
    file1.id = 1
    file1.filename = "data1.csv"
    file1.analysis_timestamp = datetime.now(timezone.utc)
    file1.project_id = 1
    file1.schema_json = "{}"
    file1.analysis_json = (
        '{"charts": [{"chart_type": "line"}, {"chart_type": "bar"}], "global_summary": ""}'
    )

    file2 = Mock()
    file2.id = 2
    file2.filename = "data2.csv"
    file2.analysis_timestamp = datetime.now(timezone.utc)
    file2.project_id = 1
    file2.schema_json = "{}"
    file2.analysis_json = (
        '{"charts": [{"chart_type": "line"}, {"chart_type": "pie"}], "global_summary": ""}'
    )

    project1 = Mock()
    project1.id = 1
    project1.name = "Project"

    # Setup mock to handle multiple .all() calls in execution order
    # First call (line 169): recent_files query (returns tuples of (file, project))
    # Second call (line 203): analyzed_files query (returns just files, not tuples)
    mock_query.all.side_effect = [
        [(file1, project1), (file2, project1)],  # recent_files (for recent analyses)
        [file1, file2],  # analyzed_files (for chart distribution)
    ]
    mock_query.order_by.return_value = mock_query
    mock_query.limit.return_value = mock_query
    mock_db.query.return_value = mock_query

    # Call endpoint
    result = await get_analytics(
        current_user=mock_user,
        db=mock_db,
    )

    # Verify chart distribution is calculated
    # Should have: 2 line, 1 bar, 1 pie
    # Fixed: use chart_type_distribution (not chart_distribution)
    assert result.chart_type_distribution.line == 2
    assert result.chart_type_distribution.bar == 1
    assert result.chart_type_distribution.pie == 1
    assert result.chart_type_distribution.scatter == 0


@pytest.mark.asyncio
async def test_get_analytics_with_top_insights(mock_db, mock_user):
    """Test analytics with top insights extraction"""
    mock_query = Mock()

    # Setup basic counts
    count_values = [2, 2, 2, 2, 0, 2, 0, 2, 0]
    mock_query.count.side_effect = count_values
    mock_query.filter.return_value = mock_query
    mock_query.join.return_value = mock_query

    # Mock files with insights
    file1 = Mock()
    file1.id = 1
    file1.filename = "sales.csv"
    file1.analysis_timestamp = datetime.now(timezone.utc)
    file1.project_id = 1
    file1.schema_json = "{}"
    file1.analysis_json = (
        '{"charts": [{"insight": "Revenue increased by 20%"}], "global_summary": ""}'
    )

    file2 = Mock()
    file2.id = 2
    file2.filename = "users.csv"
    file2.analysis_timestamp = datetime.now(timezone.utc)
    file2.project_id = 2
    file2.schema_json = "{}"
    file2.analysis_json = '{"charts": [{"insight": "User growth is strong"}], "global_summary": ""}'

    project1 = Mock()
    project1.id = 1
    project1.name = "Sales Project"

    project2 = Mock()
    project2.id = 2
    project2.name = "User Project"

    # Must return list of tuples (file, project)
    mock_query.all.return_value = [(file1, project1), (file2, project2)]
    mock_query.order_by.return_value = mock_query
    mock_query.limit.return_value = mock_query
    mock_db.query.return_value = mock_query

    # Call endpoint
    result = await get_analytics(
        current_user=mock_user,
        db=mock_db,
    )

    # Verify top insights are extracted
    assert len(result.top_insights) > 0
    insights_text = [insight.insight for insight in result.top_insights]
    assert "Revenue increased by 20%" in insights_text or "User growth is strong" in insights_text


@pytest.mark.asyncio
async def test_get_analytics_database_error(mock_db, mock_user):
    """Test analytics when database query fails"""
    # Make query raise an exception
    mock_db.query.side_effect = Exception("Database connection error")

    # Should raise HTTPException
    with pytest.raises(HTTPException) as exc_info:
        await get_analytics(
            current_user=mock_user,
            db=mock_db,
        )

    assert exc_info.value.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    assert "Failed to calculate analytics" in str(
        exc_info.value.detail
    )  # Fixed: actual error message


@pytest.mark.asyncio
async def test_get_analytics_recent_analyses_sorting(mock_db, mock_user):
    """Test that recent analyses are sorted by timestamp descending"""
    mock_query = Mock()

    # Setup basic counts
    count_values = [1, 3, 3, 1, 0, 3, 0, 3, 0]
    mock_query.count.side_effect = count_values
    mock_query.filter.return_value = mock_query
    mock_query.join.return_value = mock_query

    # Mock files with different timestamps
    file1 = Mock()
    file1.id = 1
    file1.filename = "old.csv"
    file1.analysis_timestamp = datetime.now(timezone.utc) - timedelta(days=5)
    file1.project_id = 1
    file1.schema_json = "{}"
    file1.analysis_json = "{}"

    file2 = Mock()
    file2.id = 2
    file2.filename = "new.csv"
    file2.analysis_timestamp = datetime.now(timezone.utc) - timedelta(hours=1)
    file2.project_id = 1
    file2.schema_json = "{}"
    file2.analysis_json = "{}"

    file3 = Mock()
    file3.id = 3
    file3.filename = "newest.csv"
    file3.analysis_timestamp = datetime.now(timezone.utc)
    file3.project_id = 1
    file3.schema_json = "{}"
    file3.analysis_json = "{}"

    project1 = Mock()
    project1.id = 1
    project1.name = "Project"

    # Return in order (should be sorted by timestamp desc) - must be tuples (file, project)
    mock_query.all.return_value = [(file3, project1), (file2, project1), (file1, project1)]
    mock_query.order_by.return_value = mock_query
    mock_query.limit.return_value = mock_query
    mock_db.query.return_value = mock_query

    # Call endpoint
    result = await get_analytics(
        current_user=mock_user,
        db=mock_db,
    )

    # Verify order (newest first)
    assert len(result.recent_analyses) == 3
    assert result.recent_analyses[0].filename == "newest.csv"
    assert result.recent_analyses[1].filename == "new.csv"
    assert result.recent_analyses[2].filename == "old.csv"
