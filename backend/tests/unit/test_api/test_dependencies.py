"""Tests for API dependencies."""

import pytest
from sqlalchemy.orm import Session

from app.api.dependencies import get_user_project
from app.core.exceptions import ProjectNotFoundError
from app.models.database import Project, User


class TestGetUserProject:
    """Tests for get_user_project dependency."""

    def test_returns_project_when_user_owns_it(self, db_session: Session, test_user: User):
        """Test that get_user_project returns project when user owns it."""
        # Create a project owned by test_user
        project = Project(
            name="Test Project",
            description="Test description",
            user_id=test_user.id,
            is_archived=False,
        )
        db_session.add(project)
        db_session.commit()
        db_session.refresh(project)

        # Call the dependency
        result = get_user_project(project_id=project.id, current_user=test_user, db=db_session)

        assert result.id == project.id
        assert result.name == "Test Project"
        assert result.user_id == test_user.id

    def test_raises_exception_when_project_not_found(self, db_session: Session, test_user: User):
        """Test that get_user_project raises exception when project doesn't exist."""
        with pytest.raises(ProjectNotFoundError) as exc_info:
            get_user_project(project_id=99999, current_user=test_user, db=db_session)

        assert "Project 99999 not found or access denied" in str(exc_info.value.detail)

    def test_raises_exception_when_user_does_not_own_project(
        self, db_session: Session, test_user: User, superuser: User
    ):
        """Test that get_user_project raises exception when user doesn't own project."""
        # Create a project owned by superuser
        project = Project(
            name="Superuser Project",
            description="Owned by superuser",
            user_id=superuser.id,
            is_archived=False,
        )
        db_session.add(project)
        db_session.commit()
        db_session.refresh(project)

        # Try to access it with test_user (not the owner)
        with pytest.raises(ProjectNotFoundError) as exc_info:
            get_user_project(project_id=project.id, current_user=test_user, db=db_session)

        assert f"Project {project.id} not found or access denied" in str(exc_info.value.detail)

    def test_returns_archived_project_if_owned(self, db_session: Session, test_user: User):
        """Test that get_user_project returns archived projects if user owns them."""
        # Create an archived project owned by test_user
        project = Project(
            name="Archived Project",
            description="This is archived",
            user_id=test_user.id,
            is_archived=True,
        )
        db_session.add(project)
        db_session.commit()
        db_session.refresh(project)

        # Should still return the project
        result = get_user_project(project_id=project.id, current_user=test_user, db=db_session)

        assert result.id == project.id
        assert result.is_archived is True
