"""Project service - centralized project management logic."""

import logging
from typing import List, Optional

from sqlalchemy.orm import Session

from app.core.exceptions import ProjectNotFoundError, ValidationError
from app.models.database import Project

logger = logging.getLogger(__name__)


class ProjectService:
    """Service for managing projects with proper error handling."""

    def __init__(self, db: Session):
        """
        Initialize ProjectService with database session.

        Args:
            db: SQLAlchemy database session
        """
        self.db = db

    def create_project(self, user_id: int, name: str, description: Optional[str] = None) -> Project:
        """
        Create a new project for a user.

        Args:
            user_id: ID of the user creating the project
            name: Project name
            description: Optional project description

        Returns:
            Created Project object

        Raises:
            ValidationError: If project name is empty or invalid
        """
        # Validate name
        if not name or len(name.strip()) == 0:
            raise ValidationError("Project name cannot be empty")

        # Create project
        project = Project(
            user_id=user_id, name=name.strip(), description=description, is_archived=False
        )

        self.db.add(project)
        self.db.commit()
        self.db.refresh(project)

        logger.info(
            f"Created project {project.id} for user {user_id}",
            extra={"project_id": project.id, "user_id": user_id},
        )

        return project

    def get_project(self, project_id: int, user_id: int) -> Project:
        """
        Get a project by ID, ensuring user owns it.

        Args:
            project_id: Project ID
            user_id: User ID to verify ownership

        Returns:
            Project object

        Raises:
            ProjectNotFoundError: If project not found or user doesn't own it
        """
        project = (
            self.db.query(Project)
            .filter(Project.id == project_id, Project.user_id == user_id)
            .first()
        )

        if not project:
            raise ProjectNotFoundError(f"Project {project_id} not found or access denied")

        return project

    def list_user_projects(self, user_id: int, include_archived: bool = False) -> List[Project]:
        """
        List all projects for a user.

        Args:
            user_id: User ID
            include_archived: Whether to include archived projects

        Returns:
            List of Project objects
        """
        query = self.db.query(Project).filter(Project.user_id == user_id)

        if not include_archived:
            query = query.filter(Project.is_archived == False)

        projects = query.order_by(Project.updated_at.desc()).all()

        logger.debug(
            f"Listed {len(projects)} projects for user {user_id}",
            extra={"user_id": user_id, "count": len(projects)},
        )

        return projects

    def update_project(
        self,
        project_id: int,
        user_id: int,
        name: Optional[str] = None,
        description: Optional[str] = None,
        **kwargs,
    ) -> Project:
        """
        Update a project's details.

        Args:
            project_id: Project ID
            user_id: User ID to verify ownership
            name: Optional new name
            description: Optional new description
            **kwargs: Additional fields to update

        Returns:
            Updated Project object

        Raises:
            ProjectNotFoundError: If project not found or user doesn't own it
            ValidationError: If new name is empty
        """
        # Get project (checks ownership)
        project = self.get_project(project_id, user_id)

        # Validate and update name if provided
        if name is not None:
            if len(name.strip()) == 0:
                raise ValidationError("Project name cannot be empty")
            project.name = name.strip()

        # Update description if provided
        if description is not None:
            project.description = description

        # Update any other fields (for future extensibility)
        for key, value in kwargs.items():
            if hasattr(project, key):
                setattr(project, key, value)

        self.db.commit()
        self.db.refresh(project)

        logger.info(
            f"Updated project {project_id}",
            extra={"project_id": project_id, "user_id": user_id},
        )

        return project

    def delete_project(self, project_id: int, user_id: int) -> None:
        """
        Delete a project (with cascading deletes for files).

        Args:
            project_id: Project ID
            user_id: User ID to verify ownership

        Raises:
            ProjectNotFoundError: If project not found or user doesn't own it
        """
        # Get project (checks ownership)
        project = self.get_project(project_id, user_id)

        # Delete project (cascade deletes files)
        self.db.delete(project)
        self.db.commit()

        logger.info(
            f"Deleted project {project_id}",
            extra={"project_id": project_id, "user_id": user_id},
        )

    def archive_project(self, project_id: int, user_id: int) -> Project:
        """
        Archive a project (soft delete).

        Args:
            project_id: Project ID
            user_id: User ID to verify ownership

        Returns:
            Archived Project object

        Raises:
            ProjectNotFoundError: If project not found or user doesn't own it
        """
        project = self.get_project(project_id, user_id)
        project.is_archived = True

        self.db.commit()
        self.db.refresh(project)

        logger.info(
            f"Archived project {project_id}",
            extra={"project_id": project_id, "user_id": user_id},
        )

        return project

    def unarchive_project(self, project_id: int, user_id: int) -> Project:
        """
        Unarchive a project.

        Args:
            project_id: Project ID
            user_id: User ID to verify ownership

        Returns:
            Unarchived Project object

        Raises:
            ProjectNotFoundError: If project not found or user doesn't own it
        """
        project = self.get_project(project_id, user_id)
        project.is_archived = False

        self.db.commit()
        self.db.refresh(project)

        logger.info(
            f"Unarchived project {project_id}",
            extra={"project_id": project_id, "user_id": user_id},
        )

        return project
