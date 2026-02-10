"""Common dependencies for API routes - reduces code duplication."""

from typing import Annotated

from fastapi import Depends, Path
from sqlalchemy.orm import Session

from app.core.exceptions import ProjectNotFoundError
from app.database import get_db
from app.middleware.auth import get_current_active_user
from app.models.database import Project, User


def get_user_project(
    project_id: Annotated[int, Path(description="Project ID")],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Project:
    """
    Get a project owned by the current user.

    This is a common dependency to reduce duplication across routes.

    Args:
        project_id: Project ID from path parameter
        current_user: Authenticated user
        db: Database session

    Returns:
        Project object if found and owned by user

    Raises:
        ProjectNotFoundError: If project not found or not owned by user
    """
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.user_id == current_user.id)
        .first()
    )

    if not project:
        raise ProjectNotFoundError(f"Project {project_id} not found or access denied")

    return project
