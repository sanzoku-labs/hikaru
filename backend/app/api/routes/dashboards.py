"""
Dashboard CRUD API routes for custom dashboard management.
Implements Mockup 9 - Dashboard Builder backend support.
"""
import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_active_user
from app.models.database import Dashboard, Project, User
from app.models.schemas import (
    DashboardCreate,
    DashboardListResponse,
    DashboardResponse,
    DashboardUpdate,
    ErrorResponse,
)

router = APIRouter(prefix="/api/projects", tags=["dashboards"])


@router.post(
    "/{project_id}/dashboards",
    response_model=DashboardResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_dashboard(
    project_id: int,
    dashboard: DashboardCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Create a new dashboard in a project.

    Args:
        project_id: Project ID
        dashboard: Dashboard creation data (name, type, config)
        current_user: Authenticated user
        db: Database session

    Returns:
        DashboardResponse with created dashboard information

    Raises:
        HTTP 404: If project not found
        HTTP 400: If config_json is invalid JSON
        HTTP 500: If dashboard creation fails
    """
    try:
        # Verify project exists and user owns it
        project = (
            db.query(Project)
            .filter(Project.id == project_id, Project.user_id == current_user.id)
            .first()
        )

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {project_id} not found"
            )

        # Validate config_json is valid JSON
        try:
            json.loads(dashboard.config_json)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="config_json must be valid JSON"
            )

        # Create dashboard
        db_dashboard = Dashboard(
            project_id=project_id,
            name=dashboard.name,
            dashboard_type=dashboard.dashboard_type,
            config_json=dashboard.config_json,
        )

        db.add(db_dashboard)
        db.commit()
        db.refresh(db_dashboard)

        return DashboardResponse.model_validate(db_dashboard)

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create dashboard: {str(e)}",
        )


@router.get("/{project_id}/dashboards", response_model=DashboardListResponse)
async def list_dashboards(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    List all dashboards in a project.

    Args:
        project_id: Project ID
        current_user: Authenticated user
        db: Database session

    Returns:
        DashboardListResponse with list of dashboards

    Raises:
        HTTP 404: If project not found
    """
    try:
        # Verify project exists and user owns it
        project = (
            db.query(Project)
            .filter(Project.id == project_id, Project.user_id == current_user.id)
            .first()
        )

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {project_id} not found"
            )

        # Get all dashboards for project
        dashboards = (
            db.query(Dashboard)
            .filter(Dashboard.project_id == project_id)
            .order_by(Dashboard.updated_at.desc())
            .all()
        )

        return DashboardListResponse(
            dashboards=[DashboardResponse.model_validate(d) for d in dashboards],
            total=len(dashboards),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list dashboards: {str(e)}",
        )


@router.get("/{project_id}/dashboards/{dashboard_id}", response_model=DashboardResponse)
async def get_dashboard(
    project_id: int,
    dashboard_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get a specific dashboard by ID.

    Args:
        project_id: Project ID
        dashboard_id: Dashboard ID
        current_user: Authenticated user
        db: Database session

    Returns:
        DashboardResponse with dashboard details

    Raises:
        HTTP 404: If project or dashboard not found
    """
    try:
        # Verify project exists and user owns it
        project = (
            db.query(Project)
            .filter(Project.id == project_id, Project.user_id == current_user.id)
            .first()
        )

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {project_id} not found"
            )

        # Get dashboard
        dashboard = (
            db.query(Dashboard)
            .filter(Dashboard.id == dashboard_id, Dashboard.project_id == project_id)
            .first()
        )

        if not dashboard:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dashboard {dashboard_id} not found in project {project_id}",
            )

        return DashboardResponse.model_validate(dashboard)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get dashboard: {str(e)}",
        )


@router.put("/{project_id}/dashboards/{dashboard_id}", response_model=DashboardResponse)
async def update_dashboard(
    project_id: int,
    dashboard_id: int,
    dashboard_update: DashboardUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Update a dashboard's configuration.

    Args:
        project_id: Project ID
        dashboard_id: Dashboard ID
        dashboard_update: Dashboard update data
        current_user: Authenticated user
        db: Database session

    Returns:
        DashboardResponse with updated dashboard

    Raises:
        HTTP 404: If project or dashboard not found
        HTTP 400: If config_json is invalid JSON
        HTTP 500: If update fails
    """
    try:
        # Verify project exists and user owns it
        project = (
            db.query(Project)
            .filter(Project.id == project_id, Project.user_id == current_user.id)
            .first()
        )

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {project_id} not found"
            )

        # Get dashboard
        dashboard = (
            db.query(Dashboard)
            .filter(Dashboard.id == dashboard_id, Dashboard.project_id == project_id)
            .first()
        )

        if not dashboard:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dashboard {dashboard_id} not found in project {project_id}",
            )

        # Update fields
        if dashboard_update.name is not None:
            dashboard.name = dashboard_update.name

        if dashboard_update.config_json is not None:
            # Validate JSON
            try:
                json.loads(dashboard_update.config_json)
            except json.JSONDecodeError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, detail="config_json must be valid JSON"
                )
            dashboard.config_json = dashboard_update.config_json

        if dashboard_update.chart_data is not None:
            dashboard.chart_data = dashboard_update.chart_data

        db.commit()
        db.refresh(dashboard)

        return DashboardResponse.model_validate(dashboard)

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update dashboard: {str(e)}",
        )


@router.delete("/{project_id}/dashboards/{dashboard_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dashboard(
    project_id: int,
    dashboard_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Delete a dashboard.

    Args:
        project_id: Project ID
        dashboard_id: Dashboard ID
        current_user: Authenticated user
        db: Database session

    Returns:
        204 No Content on success

    Raises:
        HTTP 404: If project or dashboard not found
        HTTP 500: If deletion fails
    """
    try:
        # Verify project exists and user owns it
        project = (
            db.query(Project)
            .filter(Project.id == project_id, Project.user_id == current_user.id)
            .first()
        )

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {project_id} not found"
            )

        # Get dashboard
        dashboard = (
            db.query(Dashboard)
            .filter(Dashboard.id == dashboard_id, Dashboard.project_id == project_id)
            .first()
        )

        if not dashboard:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dashboard {dashboard_id} not found in project {project_id}",
            )

        db.delete(dashboard)
        db.commit()

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete dashboard: {str(e)}",
        )
