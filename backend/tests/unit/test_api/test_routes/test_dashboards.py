"""
Unit tests for dashboard API routes (/api/projects/{project_id}/dashboards).

Tests cover:
- Dashboard CRUD operations (create, list, get, update, delete)
- Dashboard configuration validation
- Error handling (missing projects, invalid JSON)
"""
from datetime import datetime, timezone
from unittest.mock import Mock, patch
import json

import pytest
from fastapi import HTTPException, status

from app.api.routes.dashboards import (
    create_dashboard,
    list_dashboards,
    get_dashboard,
    update_dashboard,
    delete_dashboard,
)
from app.models.schemas import (
    DashboardCreate,
    DashboardUpdate,
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
def sample_dashboard():
    """Sample dashboard object"""
    dashboard = Mock()
    dashboard.id = 1
    dashboard.project_id = 1
    dashboard.name = "Sales Dashboard"
    dashboard.dashboard_type = "custom"
    dashboard.config_json = '{"charts": [1, 2, 3], "layout": "grid"}'
    dashboard.created_at = datetime.now(timezone.utc)
    dashboard.updated_at = datetime.now(timezone.utc)
    return dashboard


# =============================================================================
# Test create_dashboard endpoint
# =============================================================================


@pytest.mark.asyncio
async def test_create_dashboard_success(mock_db, mock_user, sample_project):
    """Test successful dashboard creation"""
    dashboard_data = DashboardCreate(
        name="Sales Dashboard",
        dashboard_type="custom",
        config_json='{"charts": [1, 2, 3]}'
    )

    # Setup db mocks
    mock_db.query.return_value.filter.return_value.first.return_value = sample_project

    with patch.object(mock_db, "refresh", side_effect=lambda obj: setattr(obj, "id", 1)):
        # Call endpoint
        result = await create_dashboard(
            project_id=1,
            dashboard=dashboard_data,
            current_user=mock_user,
            db=mock_db,
        )

    # Verify
    assert result.name == "Sales Dashboard"
    assert result.dashboard_type == "custom"
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()


@pytest.mark.asyncio
async def test_create_dashboard_project_not_found(mock_db, mock_user):
    """Test creating dashboard when project doesn't exist"""
    dashboard_data = DashboardCreate(
        name="Test Dashboard",
        dashboard_type="custom",
        config_json='{}'
    )

    # Setup db to return None for project
    mock_db.query.return_value.filter.return_value.first.return_value = None

    # Should raise HTTPException
    with pytest.raises(HTTPException) as exc_info:
        await create_dashboard(
            project_id=999,
            dashboard=dashboard_data,
            current_user=mock_user,
            db=mock_db,
        )

    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
    assert "Project 999 not found" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_create_dashboard_invalid_json(mock_db, mock_user, sample_project):
    """Test creating dashboard with invalid JSON config"""
    dashboard_data = DashboardCreate(
        name="Test Dashboard",
        dashboard_type="custom",
        config_json='{"invalid json'  # Invalid JSON
    )

    # Setup db mock
    mock_db.query.return_value.filter.return_value.first.return_value = sample_project

    # Should raise HTTPException
    with pytest.raises(HTTPException) as exc_info:
        await create_dashboard(
            project_id=1,
            dashboard=dashboard_data,
            current_user=mock_user,
            db=mock_db,
        )

    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
    assert "config_json must be valid JSON" in str(exc_info.value.detail)


# =============================================================================
# Test list_dashboards endpoint
# =============================================================================


@pytest.mark.asyncio
async def test_list_dashboards_success(mock_db, mock_user, sample_project, sample_dashboard):
    """Test listing dashboards in a project"""
    dashboard2 = Mock()
    dashboard2.id = 2
    dashboard2.name = "Revenue Dashboard"
    dashboard2.dashboard_type = "custom"
    dashboard2.config_json = '{}'
    dashboard2.created_at = datetime.now(timezone.utc)
    dashboard2.updated_at = datetime.now(timezone.utc)

    # Setup db mocks
    mock_db.query.return_value.filter.return_value.first.return_value = sample_project
    mock_db.query.return_value.filter.return_value.all.return_value = [sample_dashboard, dashboard2]

    # Call endpoint
    result = await list_dashboards(
        project_id=1,
        current_user=mock_user,
        db=mock_db,
    )

    # Verify
    assert len(result.dashboards) == 2
    assert result.total == 2


@pytest.mark.asyncio
async def test_list_dashboards_empty(mock_db, mock_user, sample_project):
    """Test listing dashboards when project has none"""
    # Setup db mocks
    mock_db.query.return_value.filter.return_value.first.return_value = sample_project
    mock_db.query.return_value.filter.return_value.all.return_value = []

    # Call endpoint
    result = await list_dashboards(
        project_id=1,
        current_user=mock_user,
        db=mock_db,
    )

    # Verify
    assert len(result.dashboards) == 0
    assert result.total == 0


# =============================================================================
# Test get_dashboard endpoint
# =============================================================================


@pytest.mark.asyncio
async def test_get_dashboard_success(mock_db, mock_user, sample_project, sample_dashboard):
    """Test getting a single dashboard"""
    # Setup db mocks
    mock_db.query.return_value.filter.return_value.first.side_effect = [
        sample_project,  # Project query
        sample_dashboard,  # Dashboard query
    ]

    # Call endpoint
    result = await get_dashboard(
        project_id=1,
        dashboard_id=1,
        current_user=mock_user,
        db=mock_db,
    )

    # Verify
    assert result.id == sample_dashboard.id
    assert result.name == sample_dashboard.name


@pytest.mark.asyncio
async def test_get_dashboard_not_found(mock_db, mock_user, sample_project):
    """Test getting non-existent dashboard"""
    # Setup db mocks - project exists, dashboard doesn't
    mock_db.query.return_value.filter.return_value.first.side_effect = [
        sample_project,
        None,  # Dashboard not found
    ]

    # Should raise HTTPException
    with pytest.raises(HTTPException) as exc_info:
        await get_dashboard(
            project_id=1,
            dashboard_id=999,
            current_user=mock_user,
            db=mock_db,
        )

    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND


# =============================================================================
# Test update_dashboard endpoint
# =============================================================================


@pytest.mark.asyncio
async def test_update_dashboard_success(mock_db, mock_user, sample_project, sample_dashboard):
    """Test successful dashboard update"""
    update_data = DashboardUpdate(
        name="Updated Dashboard",
        dashboard_type="analytics",
        config_json='{"updated": true}'
    )

    # Setup db mocks
    mock_db.query.return_value.filter.return_value.first.side_effect = [
        sample_project,
        sample_dashboard,
    ]

    # Call endpoint
    result = await update_dashboard(
        project_id=1,
        dashboard_id=1,
        update_data=update_data,
        current_user=mock_user,
        db=mock_db,
    )

    # Verify dashboard was updated
    assert sample_dashboard.name == "Updated Dashboard"
    assert sample_dashboard.dashboard_type == "analytics"
    assert sample_dashboard.config_json == '{"updated": true}'
    mock_db.commit.assert_called_once()


@pytest.mark.asyncio
async def test_update_dashboard_invalid_json(mock_db, mock_user, sample_project, sample_dashboard):
    """Test updating dashboard with invalid JSON"""
    update_data = DashboardUpdate(
        config_json='{"invalid json'
    )

    # Setup db mocks
    mock_db.query.return_value.filter.return_value.first.side_effect = [
        sample_project,
        sample_dashboard,
    ]

    # Should raise HTTPException
    with pytest.raises(HTTPException) as exc_info:
        await update_dashboard(
            project_id=1,
            dashboard_id=1,
            update_data=update_data,
            current_user=mock_user,
            db=mock_db,
        )

    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST


# =============================================================================
# Test delete_dashboard endpoint
# =============================================================================


@pytest.mark.asyncio
async def test_delete_dashboard_success(mock_db, mock_user, sample_project, sample_dashboard):
    """Test successful dashboard deletion"""
    # Setup db mocks
    mock_db.query.return_value.filter.return_value.first.side_effect = [
        sample_project,
        sample_dashboard,
    ]

    # Call endpoint
    result = await delete_dashboard(
        project_id=1,
        dashboard_id=1,
        current_user=mock_user,
        db=mock_db,
    )

    # Verify - should return None (204 No Content)
    assert result is None
    mock_db.delete.assert_called_once_with(sample_dashboard)
    mock_db.commit.assert_called_once()


@pytest.mark.asyncio
async def test_delete_dashboard_not_found(mock_db, mock_user, sample_project):
    """Test deleting non-existent dashboard"""
    # Setup db mocks
    mock_db.query.return_value.filter.return_value.first.side_effect = [
        sample_project,
        None,  # Dashboard not found
    ]

    # Should raise HTTPException
    with pytest.raises(HTTPException) as exc_info:
        await delete_dashboard(
            project_id=1,
            dashboard_id=999,
            current_user=mock_user,
            db=mock_db,
        )

    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
