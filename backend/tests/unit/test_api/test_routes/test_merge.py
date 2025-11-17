"""
Unit tests for merge API routes (/api/projects/{project_id}/merge, /relationships).

Tests cover:
- Creating merge relationships between files
- Listing relationships in a project
- Deleting relationships
- Merge analysis with charts and AI insights
- Merge compatibility validation
- Error handling (missing files, incompatible merges)
"""
from datetime import datetime, timezone
from unittest.mock import Mock, patch
import json

import pandas as pd
import pytest
from fastapi import HTTPException, status

from app.api.routes.merge import (
    create_relationship,
    list_relationships,
    analyze_merged_data,
)
from app.models.schemas import (
    RelationshipCreate,
    MergeAnalyzeRequest,
    ChartData,
    ColumnInfo,
    DataSchema,
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
    """Sample file A (customers)"""
    file = Mock()
    file.id = 1
    file.filename = "customers.csv"
    file.file_path = "storage/1/customers.csv"
    file.project_id = 1
    return file


@pytest.fixture
def sample_file_b():
    """Sample file B (orders)"""
    file = Mock()
    file.id = 2
    file.filename = "orders.csv"
    file.file_path = "storage/1/orders.csv"
    file.project_id = 1
    return file


@pytest.fixture
def sample_dataframe_a():
    """Sample DataFrame A (customers)"""
    return pd.DataFrame({
        "customer_id": [1, 2, 3],
        "name": ["Alice", "Bob", "Charlie"],
        "city": ["NYC", "LA", "SF"],
    })


@pytest.fixture
def sample_dataframe_b():
    """Sample DataFrame B (orders)"""
    return pd.DataFrame({
        "order_id": [101, 102, 103],
        "customer_id": [1, 2, 1],
        "amount": [100, 200, 150],
    })


@pytest.fixture
def sample_merged_dataframe():
    """Sample merged DataFrame"""
    return pd.DataFrame({
        "customer_id": [1, 2, 1],
        "name": ["Alice", "Bob", "Alice"],
        "city": ["NYC", "LA", "NYC"],
        "order_id": [101, 102, 103],
        "amount": [100, 200, 150],
    })


@pytest.fixture
def sample_compatibility():
    """Sample merge compatibility result"""
    return {
        "compatible": True,
        "warnings": [],
        "left_key_exists": True,
        "right_key_exists": True,
        "estimated_rows": 3,
    }


@pytest.fixture
def sample_merge_charts():
    """Sample charts from merged data"""
    return [
        ChartData(
            chart_type="bar",
            title="Total Amount by Customer",
            x_column="name",
            y_column="amount",
            data=[{"x": "Alice", "y": 250}, {"x": "Bob", "y": 200}],
            priority=1,
        )
    ]


# =============================================================================
# Test create_relationship endpoint
# =============================================================================


@pytest.mark.asyncio
async def test_create_relationship_success(
    mock_db,
    mock_user,
    sample_project,
    sample_file_a,
    sample_file_b,
    sample_dataframe_a,
    sample_dataframe_b,
    sample_compatibility,
):
    """Test successful merge relationship creation"""
    relationship_data = RelationshipCreate(
        file_a_id=1,
        file_b_id=2,
        join_type="inner",
        left_key="customer_id",
        right_key="customer_id",
        left_suffix="_customer",
        right_suffix="_order",
    )

    with patch("app.api.routes.merge.MergeService") as mock_merge_service_class:
        # Setup db mocks
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            sample_project,  # Project query
            sample_file_a,   # File A query
            sample_file_b,   # File B query
        ]

        # Setup MergeService mock
        mock_merge_service = Mock()
        mock_merge_service.load_file.side_effect = [sample_dataframe_a, sample_dataframe_b]
        mock_merge_service.validate_merge_compatibility.return_value = sample_compatibility
        mock_merge_service_class.return_value = mock_merge_service

        # Setup db operations
        with patch.object(mock_db, "refresh", side_effect=lambda obj: setattr(obj, "id", 10)):
            # Call endpoint
            result = await create_relationship(
                project_id=1,
                relationship_data=relationship_data,
                current_user=mock_user,
                db=mock_db,
            )

        # Verify result
        assert result.id == 10
        assert result.project_id == 1
        assert result.relationship_type == "merge"

        # Verify service was called
        mock_merge_service.validate_merge_compatibility.assert_called_once_with(
            sample_dataframe_a,
            sample_dataframe_b,
            "customer_id",
            "customer_id"
        )


@pytest.mark.asyncio
async def test_create_relationship_project_not_found(mock_db, mock_user):
    """Test creating relationship when project doesn't exist"""
    relationship_data = RelationshipCreate(
        file_a_id=1,
        file_b_id=2,
        join_type="inner",
        left_key="id",
        right_key="id",
    )

    # Setup db to return None for project
    mock_db.query.return_value.filter.return_value.first.return_value = None

    # Should raise HTTPException
    with pytest.raises(HTTPException) as exc_info:
        await create_relationship(
            project_id=999,
            relationship_data=relationship_data,
            current_user=mock_user,
            db=mock_db,
        )

    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
    assert "Project 999 not found" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_create_relationship_files_not_found(mock_db, mock_user, sample_project):
    """Test creating relationship when files don't exist"""
    relationship_data = RelationshipCreate(
        file_a_id=1,
        file_b_id=999,
        join_type="inner",
        left_key="id",
        right_key="id",
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
        await create_relationship(
            project_id=1,
            relationship_data=relationship_data,
            current_user=mock_user,
            db=mock_db,
        )

    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
    assert "One or both files not found" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_create_relationship_incompatible_merge(
    mock_db,
    mock_user,
    sample_project,
    sample_file_a,
    sample_file_b,
    sample_dataframe_a,
    sample_dataframe_b,
):
    """Test creating relationship when files are incompatible for merge"""
    relationship_data = RelationshipCreate(
        file_a_id=1,
        file_b_id=2,
        join_type="inner",
        left_key="nonexistent_column",
        right_key="customer_id",
    )

    with patch("app.api.routes.merge.MergeService") as mock_merge_service_class:
        # Setup db mocks
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            sample_project,
            sample_file_a,
            sample_file_b,
        ]

        # Setup MergeService mock - return incompatible
        mock_merge_service = Mock()
        mock_merge_service.load_file.side_effect = [sample_dataframe_a, sample_dataframe_b]
        mock_merge_service.validate_merge_compatibility.return_value = {
            "compatible": False,
            "warnings": ["Left key 'nonexistent_column' not found in left DataFrame"],
        }
        mock_merge_service_class.return_value = mock_merge_service

        # Should raise HTTPException
        with pytest.raises(HTTPException) as exc_info:
            await create_relationship(
                project_id=1,
                relationship_data=relationship_data,
                current_user=mock_user,
                db=mock_db,
            )

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert "not compatible for merge" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_create_relationship_left_join(
    mock_db,
    mock_user,
    sample_project,
    sample_file_a,
    sample_file_b,
    sample_dataframe_a,
    sample_dataframe_b,
    sample_compatibility,
):
    """Test creating relationship with left join"""
    relationship_data = RelationshipCreate(
        file_a_id=1,
        file_b_id=2,
        join_type="left",
        left_key="customer_id",
        right_key="customer_id",
    )

    with patch("app.api.routes.merge.MergeService") as mock_merge_service_class:
        # Setup mocks
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            sample_project,
            sample_file_a,
            sample_file_b,
        ]

        mock_merge_service = Mock()
        mock_merge_service.load_file.side_effect = [sample_dataframe_a, sample_dataframe_b]
        mock_merge_service.validate_merge_compatibility.return_value = sample_compatibility
        mock_merge_service_class.return_value = mock_merge_service

        # Setup relationship tracking
        added_relationship = None

        def track_add(obj):
            nonlocal added_relationship
            added_relationship = obj

        mock_db.add.side_effect = track_add

        with patch.object(mock_db, "refresh", side_effect=lambda obj: setattr(obj, "id", 11)):
            # Call endpoint
            await create_relationship(
                project_id=1,
                relationship_data=relationship_data,
                current_user=mock_user,
                db=mock_db,
            )

        # Verify relationship config has correct join_type
        assert added_relationship is not None
        config = json.loads(added_relationship.config_json)
        assert config["join_type"] == "left"


# =============================================================================
# Test list_relationships endpoint
# =============================================================================


@pytest.mark.asyncio
async def test_list_relationships_success(mock_db, mock_user, sample_project):
    """Test listing relationships in a project"""
    # Create mock relationships
    relationship1 = Mock()
    relationship1.id = 1
    relationship1.project_id = 1
    relationship1.file_a_id = 1
    relationship1.file_b_id = 2
    relationship1.relationship_type = "merge"
    relationship1.config_json = '{"join_type": "inner"}'
    relationship1.created_at = datetime.now(timezone.utc)

    relationship2 = Mock()
    relationship2.id = 2
    relationship2.project_id = 1
    relationship2.file_a_id = 2
    relationship2.file_b_id = 3
    relationship2.relationship_type = "comparison"
    relationship2.config_json = '{"comparison_type": "side_by_side"}'
    relationship2.created_at = datetime.now(timezone.utc)

    # Setup db mocks
    mock_db.query.return_value.filter.return_value.first.return_value = sample_project
    mock_db.query.return_value.filter.return_value.all.return_value = [relationship1, relationship2]

    # Call endpoint
    result = await list_relationships(
        project_id=1,
        current_user=mock_user,
        db=mock_db,
    )

    # Verify
    assert len(result) == 2
    assert result[0].id == 1
    assert result[1].id == 2


@pytest.mark.asyncio
async def test_list_relationships_empty(mock_db, mock_user, sample_project):
    """Test listing relationships when project has none"""
    # Setup db mocks
    mock_db.query.return_value.filter.return_value.first.return_value = sample_project
    mock_db.query.return_value.filter.return_value.all.return_value = []

    # Call endpoint
    result = await list_relationships(
        project_id=1,
        current_user=mock_user,
        db=mock_db,
    )

    # Verify
    assert len(result) == 0


# =============================================================================
# Test analyze_merged_data endpoint
# =============================================================================


@pytest.mark.asyncio
async def test_analyze_merged_data_success(
    mock_db,
    mock_user,
    sample_project,
    sample_file_a,
    sample_file_b,
    sample_dataframe_a,
    sample_dataframe_b,
    sample_merged_dataframe,
    sample_merge_charts,
):
    """Test successful merge analysis"""
    request_data = MergeAnalyzeRequest(
        file_a_id=1,
        file_b_id=2,
        join_type="inner",
        left_key="customer_id",
        right_key="customer_id",
        max_charts=4,
    )

    sample_schema = DataSchema(
        columns=[
            ColumnInfo(
                name="customer_id",
                type="numeric",
                unique_values=2,
                null_count=0,
                sample_values=[1, 2],
            ),
            ColumnInfo(
                name="name",
                type="categorical",
                unique_values=2,
                null_count=0,
                sample_values=["Alice", "Bob"],
            ),
            ColumnInfo(
                name="amount",
                type="numeric",
                unique_values=3,
                null_count=0,
                sample_values=[100, 200, 150],
                min=100,
                max=200,
                mean=150,
                median=150,
            ),
        ],
        row_count=3,
        preview=[],
    )

    with patch("app.api.routes.merge.MergeService") as mock_merge_service_class:
        with patch("app.api.routes.merge.DataProcessor") as mock_data_processor_class:
            with patch("app.api.routes.merge.AnalysisService") as mock_analysis_service_class:
                # Setup db mocks
                mock_db.query.return_value.filter.return_value.first.side_effect = [
                    sample_project,
                    sample_file_a,
                    sample_file_b,
                ]

                # Setup MergeService mock
                mock_merge_service = Mock()
                mock_merge_service.load_file.side_effect = [sample_dataframe_a, sample_dataframe_b]
                mock_merge_service.merge_dataframes.return_value = sample_merged_dataframe
                mock_merge_service_class.return_value = mock_merge_service

                # Setup DataProcessor mock
                mock_data_processor = Mock()
                mock_data_processor.detect_schema.return_value = sample_schema
                mock_data_processor_class.return_value = mock_data_processor

                # Setup AnalysisService mock
                mock_analysis_service = Mock()
                mock_analysis_service.perform_full_analysis.return_value = {
                    "charts": sample_merge_charts,
                    "global_summary": "Merged data shows customer order patterns"
                }
                mock_analysis_service_class.return_value = mock_analysis_service

                # Call endpoint
                result = await analyze_merged_data(
                    project_id=1,
                    merge_data=request_data,
                    current_user=mock_user,
                    db=mock_db,
                )

                # Verify result
                assert result.merged_rows == 3
                assert len(result.charts) == 1
                assert result.global_summary == "Merged data shows customer order patterns"
                assert result.schema.row_count == 3

                # Verify service was called
                mock_merge_service.merge_dataframes.assert_called_once_with(
                    sample_dataframe_a,
                    sample_dataframe_b,
                    left_key="customer_id",
                    right_key="customer_id",
                    join_type="inner",
                    left_suffix="_x",
                    right_suffix="_y"
                )


@pytest.mark.asyncio
async def test_analyze_merged_data_outer_join(
    mock_db,
    mock_user,
    sample_project,
    sample_file_a,
    sample_file_b,
    sample_dataframe_a,
    sample_dataframe_b,
    sample_merged_dataframe,
    sample_merge_charts,
):
    """Test merge analysis with outer join"""
    request_data = MergeAnalyzeRequest(
        file_a_id=1,
        file_b_id=2,
        join_type="outer",
        left_key="customer_id",
        right_key="customer_id",
    )

    with patch("app.api.routes.merge.MergeService") as mock_merge_service_class:
        with patch("app.api.routes.merge.DataProcessor") as mock_data_processor_class:
            with patch("app.api.routes.merge.AnalysisService") as mock_analysis_service_class:
                # Setup mocks
                mock_db.query.return_value.filter.return_value.first.side_effect = [
                    sample_project,
                    sample_file_a,
                    sample_file_b,
                ]

                mock_merge_service = Mock()
                mock_merge_service.load_file.side_effect = [sample_dataframe_a, sample_dataframe_b]
                mock_merge_service.merge_dataframes.return_value = sample_merged_dataframe
                mock_merge_service_class.return_value = mock_merge_service

                mock_data_processor = Mock()
                mock_data_processor.detect_schema.return_value = Mock(row_count=5)
                mock_data_processor_class.return_value = mock_data_processor

                mock_analysis_service = Mock()
                mock_analysis_service.perform_full_analysis.return_value = {
                    "charts": sample_merge_charts,
                    "global_summary": "Summary"
                }
                mock_analysis_service_class.return_value = mock_analysis_service

                # Call endpoint
                result = await analyze_merged_data(
                    project_id=1,
                    merge_data=request_data,
                    current_user=mock_user,
                    db=mock_db,
                )

                # Verify outer join was used
                mock_merge_service.merge_dataframes.assert_called_once()
                call_kwargs = mock_merge_service.merge_dataframes.call_args[1]
                assert call_kwargs["join_type"] == "outer"


@pytest.mark.asyncio
async def test_analyze_merged_data_project_not_found(mock_db, mock_user):
    """Test merge analysis when project doesn't exist"""
    request_data = MergeAnalyzeRequest(
        file_a_id=1,
        file_b_id=2,
        join_type="inner",
        left_key="id",
        right_key="id",
    )

    # Setup db to return None for project
    mock_db.query.return_value.filter.return_value.first.return_value = None

    # Should raise HTTPException
    with pytest.raises(HTTPException) as exc_info:
        await analyze_merged_data(
            project_id=999,
            merge_data=request_data,
            current_user=mock_user,
            db=mock_db,
        )

    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_analyze_merged_data_service_error(
    mock_db,
    mock_user,
    sample_project,
    sample_file_a,
    sample_file_b,
):
    """Test merge analysis when service throws error"""
    request_data = MergeAnalyzeRequest(
        file_a_id=1,
        file_b_id=2,
        join_type="inner",
        left_key="customer_id",
        right_key="customer_id",
    )

    with patch("app.api.routes.merge.MergeService") as mock_merge_service_class:
        # Setup db mocks
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            sample_project,
            sample_file_a,
            sample_file_b,
        ]

        # Setup MergeService to raise error
        mock_merge_service = Mock()
        mock_merge_service.load_file.side_effect = Exception("Failed to load file")
        mock_merge_service_class.return_value = mock_merge_service

        # Should raise HTTPException
        with pytest.raises(HTTPException) as exc_info:
            await analyze_merged_data(
                project_id=1,
                merge_data=request_data,
                current_user=mock_user,
                db=mock_db,
            )

        assert exc_info.value.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert "Failed to merge and analyze files" in str(exc_info.value.detail)
        mock_db.rollback.assert_called_once()
