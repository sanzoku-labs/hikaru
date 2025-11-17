"""
Unit tests for comparison API routes (/api/projects/{project_id}/compare).

Tests cover:
- File comparison within projects
- Overlay chart generation
- Comparison metrics calculation
- AI-generated comparison insights
- Error handling (missing files, incompatible files)
"""
from datetime import datetime, timezone
from unittest.mock import Mock, patch
import json

import pandas as pd
import pytest
from fastapi import HTTPException, status

from app.api.routes.compare import compare_files
from app.models.schemas import (
    ComparisonRequest,
    ChartData,
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
def sample_project():
    """Sample project object"""
    project = Mock()
    project.id = 1
    project.name = "Test Project"
    project.user_id = 1
    return project


@pytest.fixture
def sample_file_a():
    """Sample file A"""
    file = Mock()
    file.id = 1
    file.filename = "sales_2023.csv"
    file.file_path = "storage/1/sales_2023.csv"
    file.project_id = 1
    return file


@pytest.fixture
def sample_file_b():
    """Sample file B"""
    file = Mock()
    file.id = 2
    file.filename = "sales_2024.csv"
    file.file_path = "storage/1/sales_2024.csv"
    file.project_id = 1
    return file


@pytest.fixture
def sample_dataframe_a():
    """Sample DataFrame A (2023 data)"""
    return pd.DataFrame({
        "month": ["Jan", "Feb", "Mar"],
        "revenue": [100, 150, 200],
    })


@pytest.fixture
def sample_dataframe_b():
    """Sample DataFrame B (2024 data)"""
    return pd.DataFrame({
        "month": ["Jan", "Feb", "Mar"],
        "revenue": [120, 180, 240],
    })


@pytest.fixture
def sample_overlay_charts():
    """Sample overlay charts"""
    return [
        ChartData(
            chart_type="line",
            title="Revenue Comparison",
            x_column="month",
            y_column="revenue",
            data=[
                {"series": "sales_2023.csv", "x": "Jan", "y": 100},
                {"series": "sales_2023.csv", "x": "Feb", "y": 150},
                {"series": "sales_2024.csv", "x": "Jan", "y": 120},
                {"series": "sales_2024.csv", "x": "Feb", "y": 180},
            ],
            priority=1,
        )
    ]


@pytest.fixture
def sample_metrics():
    """Sample comparison metrics"""
    return {
        "total_rows_a": 3,
        "total_rows_b": 3,
        "common_columns": ["month", "revenue"],
        "correlation": 0.99,
        "avg_diff_percent": 20.0,
    }


# =============================================================================
# Test compare_files endpoint
# =============================================================================


@pytest.mark.asyncio
async def test_compare_files_success(
    mock_db,
    mock_user,
    sample_project,
    sample_file_a,
    sample_file_b,
    sample_dataframe_a,
    sample_dataframe_b,
    sample_overlay_charts,
    sample_metrics,
):
    """Test successful file comparison"""
    request_data = ComparisonRequest(
        file_a_id=1,
        file_b_id=2,
        comparison_type="side_by_side"
    )

    with patch("app.api.routes.compare.ComparisonService") as mock_comparison_service_class:
        with patch("app.api.routes.compare.AIService") as mock_ai_service_class:
            # Setup db query mocks
            mock_db.query.return_value.filter.return_value.first.side_effect = [
                sample_project,  # First query for project
                sample_file_a,   # Second query for file_a
                sample_file_b,   # Third query for file_b
            ]

            # Setup ComparisonService mock
            mock_comparison_service = Mock()
            mock_comparison_service.load_file.side_effect = [sample_dataframe_a, sample_dataframe_b]
            mock_comparison_service.generate_overlay_charts.return_value = sample_overlay_charts
            mock_comparison_service.calculate_metrics.return_value = sample_metrics
            mock_comparison_service_class.return_value = mock_comparison_service

            # Setup AIService mock
            mock_ai_service = Mock()
            mock_ai_service.generate_comparison_insight.return_value = "Revenue increased by 20% in 2024"
            mock_ai_service.generate_chart_comparison_insight.return_value = "Strong positive correlation"
            mock_ai_service_class.return_value = mock_ai_service

            # Setup db operations
            mock_relationship = Mock()
            mock_relationship.id = 1
            mock_relationship.created_at = datetime.now(timezone.utc)
            mock_db.add.return_value = None
            mock_db.commit.return_value = None
            mock_db.refresh.return_value = None

            # Mock the relationship refresh
            with patch.object(mock_db, "refresh", side_effect=lambda obj: setattr(obj, "id", 1)):
                # Call endpoint
                result = await compare_files(
                    project_id=1,
                    comparison_data=request_data,
                    current_user=mock_user,
                    db=mock_db,
                )

            # Verify result
            assert result.file_a.id == sample_file_a.id
            assert result.file_b.id == sample_file_b.id
            assert result.comparison_type == "side_by_side"
            assert len(result.overlay_charts) == 1
            assert result.summary_insight == "Revenue increased by 20% in 2024"

            # Verify services were called
            mock_comparison_service.load_file.assert_any_call(sample_file_a.file_path)
            mock_comparison_service.load_file.assert_any_call(sample_file_b.file_path)
            mock_comparison_service.generate_overlay_charts.assert_called_once()
            mock_comparison_service.calculate_metrics.assert_called_once()


@pytest.mark.asyncio
async def test_compare_files_project_not_found(mock_db, mock_user):
    """Test comparison when project doesn't exist"""
    request_data = ComparisonRequest(
        file_a_id=1,
        file_b_id=2,
        comparison_type="side_by_side"
    )

    # Setup db to return None for project
    mock_db.query.return_value.filter.return_value.first.return_value = None

    # Should raise HTTPException
    with pytest.raises(HTTPException) as exc_info:
        await compare_files(
            project_id=999,
            comparison_data=request_data,
            current_user=mock_user,
            db=mock_db,
        )

    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
    assert "Project 999 not found" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_compare_files_file_not_found(mock_db, mock_user, sample_project):
    """Test comparison when one or both files don't exist"""
    request_data = ComparisonRequest(
        file_a_id=1,
        file_b_id=999,  # Non-existent file
        comparison_type="side_by_side"
    )

    # Setup db mocks - project exists, but file_b doesn't
    mock_file_a = Mock()
    mock_file_a.id = 1

    mock_db.query.return_value.filter.return_value.first.side_effect = [
        sample_project,  # Project query
        mock_file_a,     # File A query
        None,            # File B query (not found)
    ]

    # Should raise HTTPException
    with pytest.raises(HTTPException) as exc_info:
        await compare_files(
            project_id=1,
            comparison_data=request_data,
            current_user=mock_user,
            db=mock_db,
        )

    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
    assert "One or both files not found" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_compare_files_incompatible(
    mock_db,
    mock_user,
    sample_project,
    sample_file_a,
    sample_file_b,
    sample_dataframe_a,
    sample_dataframe_b,
):
    """Test comparison when files have no compatible columns"""
    request_data = ComparisonRequest(
        file_a_id=1,
        file_b_id=2,
        comparison_type="side_by_side"
    )

    with patch("app.api.routes.compare.ComparisonService") as mock_comparison_service_class:
        # Setup db query mocks
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            sample_project,
            sample_file_a,
            sample_file_b,
        ]

        # Setup ComparisonService mock - return empty overlay charts
        mock_comparison_service = Mock()
        mock_comparison_service.load_file.side_effect = [sample_dataframe_a, sample_dataframe_b]
        mock_comparison_service.generate_overlay_charts.return_value = []  # No compatible columns
        mock_comparison_service_class.return_value = mock_comparison_service

        # Should raise HTTPException
        with pytest.raises(HTTPException) as exc_info:
            await compare_files(
                project_id=1,
                comparison_data=request_data,
                current_user=mock_user,
                db=mock_db,
            )

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert "no compatible columns" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_compare_files_year_over_year(
    mock_db,
    mock_user,
    sample_project,
    sample_file_a,
    sample_file_b,
    sample_dataframe_a,
    sample_dataframe_b,
    sample_overlay_charts,
    sample_metrics,
):
    """Test year-over-year comparison type"""
    request_data = ComparisonRequest(
        file_a_id=1,
        file_b_id=2,
        comparison_type="year_over_year"
    )

    with patch("app.api.routes.compare.ComparisonService") as mock_comparison_service_class:
        with patch("app.api.routes.compare.AIService") as mock_ai_service_class:
            # Setup mocks
            mock_db.query.return_value.filter.return_value.first.side_effect = [
                sample_project,
                sample_file_a,
                sample_file_b,
            ]

            mock_comparison_service = Mock()
            mock_comparison_service.load_file.side_effect = [sample_dataframe_a, sample_dataframe_b]
            mock_comparison_service.generate_overlay_charts.return_value = sample_overlay_charts
            mock_comparison_service.calculate_metrics.return_value = sample_metrics
            mock_comparison_service_class.return_value = mock_comparison_service

            mock_ai_service = Mock()
            mock_ai_service.generate_comparison_insight.return_value = "YoY growth: 20%"
            mock_ai_service.generate_chart_comparison_insight.return_value = "Consistent growth"
            mock_ai_service_class.return_value = mock_ai_service

            # Setup relationship
            with patch.object(mock_db, "refresh", side_effect=lambda obj: setattr(obj, "id", 2)):
                # Call endpoint
                result = await compare_files(
                    project_id=1,
                    comparison_data=request_data,
                    current_user=mock_user,
                    db=mock_db,
                )

            # Verify correct comparison_type was used
            assert result.comparison_type == "year_over_year"
            mock_comparison_service.generate_overlay_charts.assert_called_once_with(
                sample_dataframe_a,
                sample_dataframe_b,
                sample_file_a.filename,
                sample_file_b.filename,
                "year_over_year"
            )


@pytest.mark.asyncio
async def test_compare_files_trend_comparison(
    mock_db,
    mock_user,
    sample_project,
    sample_file_a,
    sample_file_b,
    sample_dataframe_a,
    sample_dataframe_b,
    sample_overlay_charts,
    sample_metrics,
):
    """Test trend comparison type"""
    request_data = ComparisonRequest(
        file_a_id=1,
        file_b_id=2,
        comparison_type="trend"
    )

    with patch("app.api.routes.compare.ComparisonService") as mock_comparison_service_class:
        with patch("app.api.routes.compare.AIService") as mock_ai_service_class:
            # Setup mocks
            mock_db.query.return_value.filter.return_value.first.side_effect = [
                sample_project,
                sample_file_a,
                sample_file_b,
            ]

            mock_comparison_service = Mock()
            mock_comparison_service.load_file.side_effect = [sample_dataframe_a, sample_dataframe_b]
            mock_comparison_service.generate_overlay_charts.return_value = sample_overlay_charts
            mock_comparison_service.calculate_metrics.return_value = sample_metrics
            mock_comparison_service_class.return_value = mock_comparison_service

            mock_ai_service = Mock()
            mock_ai_service.generate_comparison_insight.return_value = "Upward trend detected"
            mock_ai_service.generate_chart_comparison_insight.return_value = "Trend insight"
            mock_ai_service_class.return_value = mock_ai_service

            # Setup relationship
            with patch.object(mock_db, "refresh", side_effect=lambda obj: setattr(obj, "id", 3)):
                # Call endpoint
                result = await compare_files(
                    project_id=1,
                    comparison_data=request_data,
                    current_user=mock_user,
                    db=mock_db,
                )

            # Verify
            assert result.comparison_type == "trend"


@pytest.mark.asyncio
async def test_compare_files_service_error(
    mock_db,
    mock_user,
    sample_project,
    sample_file_a,
    sample_file_b,
):
    """Test comparison when service throws an error"""
    request_data = ComparisonRequest(
        file_a_id=1,
        file_b_id=2,
        comparison_type="side_by_side"
    )

    with patch("app.api.routes.compare.ComparisonService") as mock_comparison_service_class:
        # Setup db mocks
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            sample_project,
            sample_file_a,
            sample_file_b,
        ]

        # Setup ComparisonService to raise error
        mock_comparison_service = Mock()
        mock_comparison_service.load_file.side_effect = Exception("Failed to load file")
        mock_comparison_service_class.return_value = mock_comparison_service

        # Should raise HTTPException
        with pytest.raises(HTTPException) as exc_info:
            await compare_files(
                project_id=1,
                comparison_data=request_data,
                current_user=mock_user,
                db=mock_db,
            )

        assert exc_info.value.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert "Failed to compare files" in str(exc_info.value.detail)
        mock_db.rollback.assert_called_once()


@pytest.mark.asyncio
async def test_compare_files_stores_relationship(
    mock_db,
    mock_user,
    sample_project,
    sample_file_a,
    sample_file_b,
    sample_dataframe_a,
    sample_dataframe_b,
    sample_overlay_charts,
    sample_metrics,
):
    """Test that comparison stores FileRelationship in database"""
    request_data = ComparisonRequest(
        file_a_id=1,
        file_b_id=2,
        comparison_type="side_by_side"
    )

    with patch("app.api.routes.compare.ComparisonService") as mock_comparison_service_class:
        with patch("app.api.routes.compare.AIService") as mock_ai_service_class:
            # Setup mocks
            mock_db.query.return_value.filter.return_value.first.side_effect = [
                sample_project,
                sample_file_a,
                sample_file_b,
            ]

            mock_comparison_service = Mock()
            mock_comparison_service.load_file.side_effect = [sample_dataframe_a, sample_dataframe_b]
            mock_comparison_service.generate_overlay_charts.return_value = sample_overlay_charts
            mock_comparison_service.calculate_metrics.return_value = sample_metrics
            mock_comparison_service_class.return_value = mock_comparison_service

            mock_ai_service = Mock()
            mock_ai_service.generate_comparison_insight.return_value = "Insight"
            mock_ai_service.generate_chart_comparison_insight.return_value = "Chart insight"
            mock_ai_service_class.return_value = mock_ai_service

            # Setup relationship tracking
            added_relationship = None

            def track_add(obj):
                nonlocal added_relationship
                added_relationship = obj

            mock_db.add.side_effect = track_add

            with patch.object(mock_db, "refresh", side_effect=lambda obj: setattr(obj, "id", 5)):
                # Call endpoint
                await compare_files(
                    project_id=1,
                    comparison_data=request_data,
                    current_user=mock_user,
                    db=mock_db,
                )

            # Verify FileRelationship was created and stored
            assert added_relationship is not None
            assert added_relationship.project_id == 1
            assert added_relationship.file_a_id == 1
            assert added_relationship.file_b_id == 2
            assert added_relationship.relationship_type == "comparison"

            # Verify config_json contains expected data
            config = json.loads(added_relationship.config_json)
            assert config["comparison_type"] == "side_by_side"
            assert config["charts_generated"] == 1
            assert "metrics" in config

            # Verify db operations were called
            mock_db.add.assert_called_once()
            mock_db.commit.assert_called_once()
