"""Tests for ProjectService (TDD approach - tests written first)."""

import pytest
from sqlalchemy.orm import Session

from app.core.exceptions import ProjectNotFoundError, ValidationError
from app.models.database import File, Project, User
from app.services.project_service import ProjectService


class TestProjectServiceCreate:
    """Tests for creating projects."""

    def test_create_project_success(self, db_session: Session, test_user: User):
        """Test creating a project with valid data."""
        service = ProjectService(db_session)

        project = service.create_project(
            user_id=test_user.id, name="Test Project", description="Test description"
        )

        assert project.id is not None
        assert project.name == "Test Project"
        assert project.description == "Test description"
        assert project.user_id == test_user.id
        assert project.is_archived is False

    def test_create_project_without_description(self, db_session: Session, test_user: User):
        """Test creating a project without description."""
        service = ProjectService(db_session)

        project = service.create_project(user_id=test_user.id, name="Minimal Project")

        assert project.id is not None
        assert project.name == "Minimal Project"
        assert project.description is None

    def test_create_project_empty_name_raises_error(self, db_session: Session, test_user: User):
        """Test that empty project name raises ValidationError."""
        service = ProjectService(db_session)

        with pytest.raises(ValidationError) as exc_info:
            service.create_project(user_id=test_user.id, name="")

        assert "Project name cannot be empty" in str(exc_info.value.detail)

    def test_create_project_whitespace_name_raises_error(
        self, db_session: Session, test_user: User
    ):
        """Test that whitespace-only project name raises ValidationError."""
        service = ProjectService(db_session)

        with pytest.raises(ValidationError) as exc_info:
            service.create_project(user_id=test_user.id, name="   ")

        assert "Project name cannot be empty" in str(exc_info.value.detail)

    def test_create_project_trims_whitespace(self, db_session: Session, test_user: User):
        """Test that project name whitespace is trimmed."""
        service = ProjectService(db_session)

        project = service.create_project(user_id=test_user.id, name="  Trimmed Name  ")

        assert project.name == "Trimmed Name"


class TestProjectServiceGet:
    """Tests for getting projects."""

    def test_get_project_owned_by_user(self, db_session: Session, test_user: User):
        """Test getting a project owned by the user."""
        service = ProjectService(db_session)

        # Create project
        created = service.create_project(user_id=test_user.id, name="My Project")

        # Get project
        retrieved = service.get_project(project_id=created.id, user_id=test_user.id)

        assert retrieved.id == created.id
        assert retrieved.name == "My Project"
        assert retrieved.user_id == test_user.id

    def test_get_project_not_owned_raises_error(
        self, db_session: Session, test_user: User, superuser: User
    ):
        """Test that getting a project not owned by user raises error."""
        service = ProjectService(db_session)

        # Create project owned by superuser
        project = service.create_project(user_id=superuser.id, name="Superuser Project")

        # Try to get with test_user (should fail)
        with pytest.raises(ProjectNotFoundError) as exc_info:
            service.get_project(project_id=project.id, user_id=test_user.id)

        assert f"Project {project.id} not found or access denied" in str(exc_info.value.detail)

    def test_get_nonexistent_project_raises_error(self, db_session: Session, test_user: User):
        """Test that getting non-existent project raises error."""
        service = ProjectService(db_session)

        with pytest.raises(ProjectNotFoundError) as exc_info:
            service.get_project(project_id=99999, user_id=test_user.id)

        assert "Project 99999 not found or access denied" in str(exc_info.value.detail)

    def test_get_archived_project(self, db_session: Session, test_user: User):
        """Test that archived projects can still be retrieved."""
        service = ProjectService(db_session)

        # Create and archive project
        project = service.create_project(user_id=test_user.id, name="Archived Project")
        archived = service.archive_project(project_id=project.id, user_id=test_user.id)

        # Should still be able to get it
        retrieved = service.get_project(project_id=archived.id, user_id=test_user.id)

        assert retrieved.is_archived is True


class TestProjectServiceList:
    """Tests for listing projects."""

    def test_list_user_projects(self, db_session: Session, test_user: User):
        """Test listing all projects for a user."""
        service = ProjectService(db_session)

        # Create multiple projects
        service.create_project(user_id=test_user.id, name="Project 1")
        service.create_project(user_id=test_user.id, name="Project 2")
        service.create_project(user_id=test_user.id, name="Project 3")

        # List projects
        projects = service.list_user_projects(user_id=test_user.id, include_archived=True)

        assert len(projects) == 3
        project_names = [p.name for p in projects]
        assert "Project 1" in project_names
        assert "Project 2" in project_names
        assert "Project 3" in project_names

    def test_list_excludes_other_users_projects(
        self, db_session: Session, test_user: User, superuser: User
    ):
        """Test that listing only returns user's own projects."""
        service = ProjectService(db_session)

        # Create projects for different users
        service.create_project(user_id=test_user.id, name="User Project")
        service.create_project(user_id=superuser.id, name="Superuser Project")

        # List test_user's projects
        projects = service.list_user_projects(user_id=test_user.id, include_archived=True)

        assert len(projects) == 1
        assert projects[0].name == "User Project"

    def test_list_excludes_archived_by_default(self, db_session: Session, test_user: User):
        """Test that archived projects are excluded by default."""
        service = ProjectService(db_session)

        # Create active and archived projects
        service.create_project(user_id=test_user.id, name="Active Project")
        archived = service.create_project(user_id=test_user.id, name="Archived Project")
        service.archive_project(project_id=archived.id, user_id=test_user.id)

        # List without archived
        projects = service.list_user_projects(user_id=test_user.id, include_archived=False)

        assert len(projects) == 1
        assert projects[0].name == "Active Project"

    def test_list_includes_archived_when_requested(self, db_session: Session, test_user: User):
        """Test that archived projects are included when requested."""
        service = ProjectService(db_session)

        # Create active and archived projects
        service.create_project(user_id=test_user.id, name="Active Project")
        archived = service.create_project(user_id=test_user.id, name="Archived Project")
        service.archive_project(project_id=archived.id, user_id=test_user.id)

        # List with archived
        projects = service.list_user_projects(user_id=test_user.id, include_archived=True)

        assert len(projects) == 2

    def test_list_empty_for_user_with_no_projects(self, db_session: Session, test_user: User):
        """Test that listing returns empty list for user with no projects."""
        service = ProjectService(db_session)

        projects = service.list_user_projects(user_id=test_user.id, include_archived=True)

        assert projects == []


class TestProjectServiceUpdate:
    """Tests for updating projects."""

    def test_update_project_name(self, db_session: Session, test_user: User):
        """Test updating project name."""
        service = ProjectService(db_session)

        project = service.create_project(user_id=test_user.id, name="Old Name")
        updated = service.update_project(
            project_id=project.id, user_id=test_user.id, name="New Name"
        )

        assert updated.name == "New Name"
        assert updated.description == project.description  # Unchanged

    def test_update_project_description(self, db_session: Session, test_user: User):
        """Test updating project description."""
        service = ProjectService(db_session)

        project = service.create_project(user_id=test_user.id, name="Project")
        updated = service.update_project(
            project_id=project.id, user_id=test_user.id, description="New description"
        )

        assert updated.description == "New description"
        assert updated.name == "Project"  # Unchanged

    def test_update_project_not_owned_raises_error(
        self, db_session: Session, test_user: User, superuser: User
    ):
        """Test that updating project not owned by user raises error."""
        service = ProjectService(db_session)

        # Create project owned by superuser
        project = service.create_project(user_id=superuser.id, name="Superuser Project")

        # Try to update with test_user (should fail)
        with pytest.raises(ProjectNotFoundError):
            service.update_project(project_id=project.id, user_id=test_user.id, name="Hacked")

    def test_update_project_empty_name_raises_error(self, db_session: Session, test_user: User):
        """Test that updating to empty name raises ValidationError."""
        service = ProjectService(db_session)

        project = service.create_project(user_id=test_user.id, name="Valid Name")

        with pytest.raises(ValidationError) as exc_info:
            service.update_project(project_id=project.id, user_id=test_user.id, name="")

        assert "Project name cannot be empty" in str(exc_info.value.detail)


class TestProjectServiceDelete:
    """Tests for deleting projects."""

    def test_delete_project(self, db_session: Session, test_user: User):
        """Test deleting a project."""
        service = ProjectService(db_session)

        project = service.create_project(user_id=test_user.id, name="To Delete")
        service.delete_project(project_id=project.id, user_id=test_user.id)

        # Should not be able to get it anymore
        with pytest.raises(ProjectNotFoundError):
            service.get_project(project_id=project.id, user_id=test_user.id)

    def test_delete_project_not_owned_raises_error(
        self, db_session: Session, test_user: User, superuser: User
    ):
        """Test that deleting project not owned by user raises error."""
        service = ProjectService(db_session)

        project = service.create_project(user_id=superuser.id, name="Superuser Project")

        with pytest.raises(ProjectNotFoundError):
            service.delete_project(project_id=project.id, user_id=test_user.id)

    def test_delete_project_cascades_to_files(self, db_session: Session, test_user: User):
        """Test that deleting project also deletes associated files."""
        service = ProjectService(db_session)

        # Create project
        project = service.create_project(user_id=test_user.id, name="Project With Files")

        # Add files to project
        file1 = File(
            project_id=project.id,
            filename="file1.csv",
            upload_id="upload-1",
            file_path="/tmp/file1.csv",
            file_size=1000,
        )
        file2 = File(
            project_id=project.id,
            filename="file2.csv",
            upload_id="upload-2",
            file_path="/tmp/file2.csv",
            file_size=2000,
        )
        db_session.add(file1)
        db_session.add(file2)
        db_session.commit()

        # Delete project
        service.delete_project(project_id=project.id, user_id=test_user.id)

        # Files should also be deleted (cascading)
        assert db_session.query(File).filter_by(project_id=project.id).count() == 0


class TestProjectServiceArchive:
    """Tests for archiving/unarchiving projects."""

    def test_archive_project(self, db_session: Session, test_user: User):
        """Test archiving a project."""
        service = ProjectService(db_session)

        project = service.create_project(user_id=test_user.id, name="To Archive")
        archived = service.archive_project(project_id=project.id, user_id=test_user.id)

        assert archived.is_archived is True

    def test_unarchive_project(self, db_session: Session, test_user: User):
        """Test unarchiving a project."""
        service = ProjectService(db_session)

        project = service.create_project(user_id=test_user.id, name="Archived")
        archived = service.archive_project(project_id=project.id, user_id=test_user.id)
        unarchived = service.unarchive_project(project_id=archived.id, user_id=test_user.id)

        assert unarchived.is_archived is False

    def test_archive_project_not_owned_raises_error(
        self, db_session: Session, test_user: User, superuser: User
    ):
        """Test that archiving project not owned raises error."""
        service = ProjectService(db_session)

        project = service.create_project(user_id=superuser.id, name="Superuser Project")

        with pytest.raises(ProjectNotFoundError):
            service.archive_project(project_id=project.id, user_id=test_user.id)
