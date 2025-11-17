"""
Unit tests for projects API routes (/api/projects/*).

Tests cover:
- Project CRUD operations (create, list, get, update, delete)
- File upload to projects
- File management (list, delete, download)
- File analysis within projects
- Analysis history tracking
- Error handling and validation
"""
from datetime import datetime, timezone
from io import BytesIO
from unittest.mock import Mock, patch, MagicMock
import json

import pandas as pd
import pytest
from fastapi import HTTPException, UploadFile, status

from app.api.routes.projects import (
    create_project,
    list_projects,
    get_project,
    update_project,
    delete_project,
    upload_file_to_project,
    list_project_files,
    delete_project_file,
    download_project_file,
    analyze_project_file,
    get_project_file_analysis,
)
from app.models.schemas import (
    ProjectCreate,
    ProjectUpdate,
    FileAnalyzeRequest,
    ChartData,
    ColumnInfo,
    DataSchema,
)
from app.core.exceptions import ProjectNotFoundError, ValidationError


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
    user.username = "testuser"
    user.is_active = True
    return user


@pytest.fixture
def sample_project():
    """Sample project object"""
    project = Mock()
    project.id = 1
    project.name = "Test Project"
    project.description = "Test Description"
    project.user_id = 1
    project.created_at = datetime.now(timezone.utc)
    project.updated_at = datetime.now(timezone.utc)
    project.is_archived = False
    return project


@pytest.fixture
def sample_file():
    """Sample file object"""
    file = Mock()
    file.id = 1
    file.filename = "test_data.csv"
    file.file_path = "storage/1/test_data.csv"
    file.file_size = 1024
    file.project_id = 1
    file.uploaded_at = datetime.now(timezone.utc)
    file.analysis_json = None
    file.schema_json = None
    return file


@pytest.fixture
def sample_dataframe():
    """Sample pandas DataFrame"""
    return pd.DataFrame({
        "date": pd.date_range("2024-01-01", periods=10, freq="D"),
        "revenue": [100, 150, 200, 250, 300, 350, 400, 450, 500, 550],
        "category": ["A", "B", "A", "B", "A", "B", "A", "B", "A", "B"],
    })


@pytest.fixture
def sample_schema():
    """Sample data schema"""
    return DataSchema(
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
        ],
        row_count=10,
        preview=[],
    )


# =============================================================================
# Test create_project endpoint
# =============================================================================


@pytest.mark.asyncio
async def test_create_project_success(mock_db, mock_user, sample_project):
    """Test successful project creation"""
    project_data = ProjectCreate(
        name="New Project",
        description="New project description"
    )

    with patch("app.api.routes.projects.ProjectService") as mock_project_service_class:
        # Setup mock
        mock_project_service = Mock()
        mock_project_service.create_project.return_value = sample_project
        mock_project_service_class.return_value = mock_project_service

        # Call endpoint
        result = await create_project(
            project_data=project_data,
            current_user=mock_user,
            db=mock_db,
        )

        # Verify
        assert result.id == sample_project.id
        assert result.name == sample_project.name
        assert result.file_count == 0
        mock_project_service.create_project.assert_called_once_with(
            user_id=mock_user.id,
            name="New Project",
            description="New project description",
        )


@pytest.mark.asyncio
async def test_create_project_validation_error(mock_db, mock_user):
    """Test project creation with validation error"""
    project_data = ProjectCreate(name="", description="Test")  # Empty name

    with patch("app.api.routes.projects.ProjectService") as mock_project_service_class:
        mock_project_service = Mock()
        mock_project_service.create_project.side_effect = ValidationError(
            detail="Project name cannot be empty"
        )
        mock_project_service_class.return_value = mock_project_service

        # Should raise HTTPException
        with pytest.raises(HTTPException) as exc_info:
            await create_project(
                project_data=project_data,
                current_user=mock_user,
                db=mock_db,
            )

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.asyncio
async def test_create_project_server_error(mock_db, mock_user):
    """Test project creation with server error"""
    project_data = ProjectCreate(name="Test", description="Test")

    with patch("app.api.routes.projects.ProjectService") as mock_project_service_class:
        mock_project_service = Mock()
        mock_project_service.create_project.side_effect = Exception("Database error")
        mock_project_service_class.return_value = mock_project_service

        # Should raise HTTPException
        with pytest.raises(HTTPException) as exc_info:
            await create_project(
                project_data=project_data,
                current_user=mock_user,
                db=mock_db,
            )

        assert exc_info.value.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        mock_db.rollback.assert_called_once()


# =============================================================================
# Test list_projects endpoint
# =============================================================================


@pytest.mark.asyncio
async def test_list_projects_success(mock_db, mock_user, sample_project):
    """Test listing user's projects"""
    with patch("app.api.routes.projects.ProjectService") as mock_project_service_class:
        # Setup mock
        mock_project_service = Mock()
        mock_project_service.list_projects.return_value = [sample_project]
        mock_project_service_class.return_value = mock_project_service

        # Call endpoint
        result = await list_projects(
            include_archived=False,
            current_user=mock_user,
            db=mock_db,
        )

        # Verify
        assert len(result.projects) == 1
        assert result.projects[0].id == sample_project.id
        assert result.total == 1
        mock_project_service.list_projects.assert_called_once_with(
            user_id=mock_user.id,
            include_archived=False,
        )


@pytest.mark.asyncio
async def test_list_projects_include_archived(mock_db, mock_user, sample_project):
    """Test listing projects including archived ones"""
    archived_project = Mock()
    archived_project.id = 2
    archived_project.name = "Archived Project"
    archived_project.is_archived = True
    archived_project.created_at = datetime.now(timezone.utc)
    archived_project.updated_at = datetime.now(timezone.utc)

    with patch("app.api.routes.projects.ProjectService") as mock_project_service_class:
        mock_project_service = Mock()
        mock_project_service.list_projects.return_value = [sample_project, archived_project]
        mock_project_service_class.return_value = mock_project_service

        # Call endpoint
        result = await list_projects(
            include_archived=True,
            current_user=mock_user,
            db=mock_db,
        )

        # Verify
        assert len(result.projects) == 2
        assert result.total == 2


@pytest.mark.asyncio
async def test_list_projects_empty(mock_db, mock_user):
    """Test listing projects when user has none"""
    with patch("app.api.routes.projects.ProjectService") as mock_project_service_class:
        mock_project_service = Mock()
        mock_project_service.list_projects.return_value = []
        mock_project_service_class.return_value = mock_project_service

        # Call endpoint
        result = await list_projects(
            include_archived=False,
            current_user=mock_user,
            db=mock_db,
        )

        # Verify
        assert len(result.projects) == 0
        assert result.total == 0


# =============================================================================
# Test get_project endpoint
# =============================================================================


@pytest.mark.asyncio
async def test_get_project_success(mock_db, mock_user, sample_project):
    """Test getting a single project"""
    with patch("app.api.routes.projects.ProjectService") as mock_project_service_class:
        mock_project_service = Mock()
        mock_project_service.get_project.return_value = sample_project
        mock_project_service_class.return_value = mock_project_service

        # Call endpoint
        result = await get_project(
            project_id=1,
            current_user=mock_user,
            db=mock_db,
        )

        # Verify
        assert result.id == sample_project.id
        assert result.name == sample_project.name
        mock_project_service.get_project.assert_called_once_with(
            project_id=1,
            user_id=mock_user.id,
        )


@pytest.mark.asyncio
async def test_get_project_not_found(mock_db, mock_user):
    """Test getting non-existent project"""
    with patch("app.api.routes.projects.ProjectService") as mock_project_service_class:
        mock_project_service = Mock()
        mock_project_service.get_project.side_effect = ProjectNotFoundError(project_id=999)
        mock_project_service_class.return_value = mock_project_service

        # Should raise HTTPException
        with pytest.raises(HTTPException) as exc_info:
            await get_project(
                project_id=999,
                current_user=mock_user,
                db=mock_db,
            )

        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND


# =============================================================================
# Test update_project endpoint
# =============================================================================


@pytest.mark.asyncio
async def test_update_project_success(mock_db, mock_user, sample_project):
    """Test successful project update"""
    update_data = ProjectUpdate(
        name="Updated Name",
        description="Updated Description"
    )

    with patch("app.api.routes.projects.ProjectService") as mock_project_service_class:
        # Setup mock - return updated project
        updated_project = Mock()
        updated_project.id = sample_project.id
        updated_project.name = "Updated Name"
        updated_project.description = "Updated Description"
        updated_project.user_id = sample_project.user_id
        updated_project.created_at = sample_project.created_at
        updated_project.updated_at = datetime.now(timezone.utc)
        updated_project.is_archived = False

        mock_project_service = Mock()
        mock_project_service.update_project.return_value = updated_project
        mock_project_service_class.return_value = mock_project_service

        # Call endpoint
        result = await update_project(
            project_id=1,
            update_data=update_data,
            current_user=mock_user,
            db=mock_db,
        )

        # Verify
        assert result.name == "Updated Name"
        assert result.description == "Updated Description"
        mock_project_service.update_project.assert_called_once()


@pytest.mark.asyncio
async def test_update_project_not_found(mock_db, mock_user):
    """Test updating non-existent project"""
    update_data = ProjectUpdate(name="Updated")

    with patch("app.api.routes.projects.ProjectService") as mock_project_service_class:
        mock_project_service = Mock()
        mock_project_service.update_project.side_effect = ProjectNotFoundError(project_id=999)
        mock_project_service_class.return_value = mock_project_service

        # Should raise HTTPException
        with pytest.raises(HTTPException) as exc_info:
            await update_project(
                project_id=999,
                update_data=update_data,
                current_user=mock_user,
                db=mock_db,
            )

        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND


# =============================================================================
# Test delete_project endpoint
# =============================================================================


@pytest.mark.asyncio
async def test_delete_project_success(mock_db, mock_user):
    """Test successful project deletion"""
    with patch("app.api.routes.projects.ProjectService") as mock_project_service_class:
        mock_project_service = Mock()
        mock_project_service.delete_project.return_value = None
        mock_project_service_class.return_value = mock_project_service

        # Call endpoint
        result = await delete_project(
            project_id=1,
            current_user=mock_user,
            db=mock_db,
        )

        # Verify - should return None (204 No Content)
        assert result is None
        mock_project_service.delete_project.assert_called_once_with(
            project_id=1,
            user_id=mock_user.id,
        )


@pytest.mark.asyncio
async def test_delete_project_not_found(mock_db, mock_user):
    """Test deleting non-existent project"""
    with patch("app.api.routes.projects.ProjectService") as mock_project_service_class:
        mock_project_service = Mock()
        mock_project_service.delete_project.side_effect = ProjectNotFoundError(project_id=999)
        mock_project_service_class.return_value = mock_project_service

        # Should raise HTTPException
        with pytest.raises(HTTPException) as exc_info:
            await delete_project(
                project_id=999,
                current_user=mock_user,
                db=mock_db,
            )

        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND


# =============================================================================
# Test upload_file_to_project endpoint
# =============================================================================


@pytest.mark.asyncio
async def test_upload_file_to_project_success(mock_db, mock_user, sample_project, sample_file, sample_dataframe, sample_schema):
    """Test successful file upload to project"""
    # Create mock uploaded file
    file_content = b"date,revenue\n2024-01-01,100\n2024-01-02,150"
    mock_upload_file = Mock(spec=UploadFile)
    mock_upload_file.filename = "test_data.csv"
    mock_upload_file.read = Mock(return_value=file_content)
    mock_upload_file.seek = Mock()
    mock_upload_file.file = BytesIO(file_content)

    with patch("app.api.routes.projects.ProjectService") as mock_project_service_class:
        with patch("app.api.routes.projects.DataProcessor") as mock_data_processor_class:
            # Setup mocks
            mock_project_service = Mock()
            mock_project_service.get_project.return_value = sample_project
            mock_project_service.add_file_to_project.return_value = sample_file
            mock_project_service_class.return_value = mock_project_service

            mock_data_processor = Mock()
            mock_data_processor.process.return_value = (sample_dataframe, sample_schema)
            mock_data_processor_class.return_value = mock_data_processor

            # Call endpoint
            result = await upload_file_to_project(
                project_id=1,
                file=mock_upload_file,
                current_user=mock_user,
                db=mock_db,
            )

            # Verify
            assert result.file_id == sample_file.id
            assert result.filename == sample_file.filename
            assert result.project_id == 1
            mock_project_service.add_file_to_project.assert_called_once()


@pytest.mark.asyncio
async def test_upload_file_invalid_extension(mock_db, mock_user):
    """Test uploading file with invalid extension"""
    mock_upload_file = Mock(spec=UploadFile)
    mock_upload_file.filename = "test.txt"  # Invalid extension

    with patch("app.api.routes.projects.ProjectService") as mock_project_service_class:
        mock_project_service = Mock()
        mock_project_service.get_project.return_value = Mock()
        mock_project_service_class.return_value = mock_project_service

        # Should raise HTTPException
        with pytest.raises(HTTPException) as exc_info:
            await upload_file_to_project(
                project_id=1,
                file=mock_upload_file,
                current_user=mock_user,
                db=mock_db,
            )

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert "Invalid file type" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_upload_file_project_not_found(mock_db, mock_user):
    """Test uploading file to non-existent project"""
    mock_upload_file = Mock(spec=UploadFile)
    mock_upload_file.filename = "test.csv"

    with patch("app.api.routes.projects.ProjectService") as mock_project_service_class:
        mock_project_service = Mock()
        mock_project_service.get_project.side_effect = ProjectNotFoundError(project_id=999)
        mock_project_service_class.return_value = mock_project_service

        # Should raise HTTPException
        with pytest.raises(HTTPException) as exc_info:
            await upload_file_to_project(
                project_id=999,
                file=mock_upload_file,
                current_user=mock_user,
                db=mock_db,
            )

        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND


# =============================================================================
# Test list_project_files endpoint
# =============================================================================


@pytest.mark.asyncio
async def test_list_project_files_success(mock_db, mock_user, sample_project, sample_file):
    """Test listing files in a project"""
    with patch("app.api.routes.projects.ProjectService") as mock_project_service_class:
        mock_project_service = Mock()
        mock_project_service.get_project.return_value = sample_project
        mock_project_service.list_project_files.return_value = [sample_file]
        mock_project_service_class.return_value = mock_project_service

        # Call endpoint
        result = await list_project_files(
            project_id=1,
            current_user=mock_user,
            db=mock_db,
        )

        # Verify
        assert len(result) == 1
        assert result[0].id == sample_file.id
        assert result[0].filename == sample_file.filename


@pytest.mark.asyncio
async def test_list_project_files_empty(mock_db, mock_user, sample_project):
    """Test listing files when project has none"""
    with patch("app.api.routes.projects.ProjectService") as mock_project_service_class:
        mock_project_service = Mock()
        mock_project_service.get_project.return_value = sample_project
        mock_project_service.list_project_files.return_value = []
        mock_project_service_class.return_value = mock_project_service

        # Call endpoint
        result = await list_project_files(
            project_id=1,
            current_user=mock_user,
            db=mock_db,
        )

        # Verify
        assert len(result) == 0


# =============================================================================
# Test delete_project_file endpoint
# =============================================================================


@pytest.mark.asyncio
async def test_delete_project_file_success(mock_db, mock_user):
    """Test successful file deletion"""
    with patch("app.api.routes.projects.ProjectService") as mock_project_service_class:
        mock_project_service = Mock()
        mock_project_service.delete_file.return_value = None
        mock_project_service_class.return_value = mock_project_service

        # Call endpoint
        result = await delete_project_file(
            project_id=1,
            file_id=1,
            current_user=mock_user,
            db=mock_db,
        )

        # Verify - should return None (204 No Content)
        assert result is None
        mock_project_service.delete_file.assert_called_once_with(
            project_id=1,
            file_id=1,
            user_id=mock_user.id,
        )


@pytest.mark.asyncio
async def test_delete_project_file_not_found(mock_db, mock_user):
    """Test deleting non-existent file"""
    with patch("app.api.routes.projects.ProjectService") as mock_project_service_class:
        mock_project_service = Mock()
        mock_project_service.delete_file.side_effect = HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
        mock_project_service_class.return_value = mock_project_service

        # Should raise HTTPException
        with pytest.raises(HTTPException) as exc_info:
            await delete_project_file(
                project_id=1,
                file_id=999,
                current_user=mock_user,
                db=mock_db,
            )

        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND


# =============================================================================
# Test analyze_project_file endpoint
# =============================================================================


@pytest.mark.asyncio
async def test_analyze_project_file_success(mock_db, mock_user, sample_file, sample_dataframe, sample_schema):
    """Test successful file analysis"""
    request_data = FileAnalyzeRequest(max_charts=4, user_intent=None)

    sample_charts = [
        ChartData(
            chart_type="line",
            title="Revenue Over Time",
            x_column="date",
            y_column="revenue",
            data=[{"x": "2024-01-01", "y": 100}],
            priority=1,
        )
    ]

    with patch("app.api.routes.projects.ProjectService") as mock_project_service_class:
        with patch("app.api.routes.projects.DataProcessor") as mock_data_processor_class:
            with patch("app.api.routes.projects.AnalysisService") as mock_analysis_service_class:
                # Setup mocks
                mock_project_service = Mock()
                mock_project_service.get_file.return_value = sample_file
                mock_project_service.save_file_analysis.return_value = None
                mock_project_service_class.return_value = mock_project_service

                mock_data_processor = Mock()
                mock_data_processor.load_dataframe_from_file.return_value = sample_dataframe
                mock_data_processor.detect_schema.return_value = sample_schema
                mock_data_processor_class.return_value = mock_data_processor

                mock_analysis_service = Mock()
                mock_analysis_service.perform_full_analysis.return_value = {
                    "charts": sample_charts,
                    "global_summary": "Revenue is growing steadily"
                }
                mock_analysis_service_class.return_value = mock_analysis_service

                # Call endpoint
                result = await analyze_project_file(
                    project_id=1,
                    file_id=1,
                    request_data=request_data,
                    current_user=mock_user,
                    db=mock_db,
                )

                # Verify
                assert result.file_id == sample_file.id
                assert result.filename == sample_file.filename
                assert len(result.charts) == 1
                assert result.global_summary == "Revenue is growing steadily"
                mock_project_service.save_file_analysis.assert_called_once()


@pytest.mark.asyncio
async def test_analyze_project_file_not_found(mock_db, mock_user):
    """Test analyzing non-existent file"""
    request_data = FileAnalyzeRequest(max_charts=4)

    with patch("app.api.routes.projects.ProjectService") as mock_project_service_class:
        mock_project_service = Mock()
        mock_project_service.get_file.side_effect = HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
        mock_project_service_class.return_value = mock_project_service

        # Should raise HTTPException
        with pytest.raises(HTTPException) as exc_info:
            await analyze_project_file(
                project_id=1,
                file_id=999,
                request_data=request_data,
                current_user=mock_user,
                db=mock_db,
            )

        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
