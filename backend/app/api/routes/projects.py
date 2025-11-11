"""
Project management API endpoints for Phase 7.

Handles CRUD operations for projects and project files.
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app.middleware.auth import get_current_active_user
from app.models.schemas import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectListResponse,
    ProjectFileUploadResponse,
    FileInProject,
    ErrorResponse
)
from app.models.database import User, Project, File as FileModel
from app.services.data_processor import DataProcessor
import uuid
import os
import shutil
from pathlib import Path

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new project.

    Args:
        project_data: Project creation data (name, description)
        current_user: Authenticated user
        db: Database session

    Returns:
        ProjectResponse with created project information

    Raises:
        HTTP 400: If project data is invalid
        HTTP 500: If project creation fails
    """
    try:
        # Create new project
        new_project = Project(
            name=project_data.name,
            description=project_data.description,
            user_id=current_user.id
        )

        db.add(new_project)
        db.commit()
        db.refresh(new_project)

        # Return project with file_count = 0
        response = ProjectResponse.model_validate(new_project)
        response.file_count = 0

        return response

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create project: {str(e)}"
        )


@router.get("", response_model=ProjectListResponse)
async def list_projects(
    include_archived: bool = False,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List all projects for the current user.

    Args:
        include_archived: Whether to include archived projects
        current_user: Authenticated user
        db: Database session

    Returns:
        ProjectListResponse with list of projects and total count
    """
    try:
        query = db.query(Project).filter(Project.user_id == current_user.id)

        if not include_archived:
            query = query.filter(Project.is_archived == False)

        projects = query.order_by(Project.updated_at.desc()).all()

        # Add file_count to each project
        project_responses = []
        for project in projects:
            project_response = ProjectResponse.model_validate(project)
            project_response.file_count = len(project.files)
            project_responses.append(project_response)

        return ProjectListResponse(
            projects=project_responses,
            total=len(project_responses)
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list projects: {str(e)}"
        )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific project by ID.

    Args:
        project_id: Project ID
        current_user: Authenticated user
        db: Database session

    Returns:
        ProjectResponse with project details including files

    Raises:
        HTTP 404: If project not found or not owned by user
    """
    try:
        project = db.query(Project).filter(
            Project.id == project_id,
            Project.user_id == current_user.id
        ).first()

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project {project_id} not found"
            )

        # Convert to response and include files
        project_response = ProjectResponse.model_validate(project)
        project_response.file_count = len(project.files)
        project_response.files = [FileInProject.model_validate(f) for f in project.files]

        return project_response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get project: {str(e)}"
        )


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update a project.

    Args:
        project_id: Project ID
        project_data: Project update data
        current_user: Authenticated user
        db: Database session

    Returns:
        ProjectResponse with updated project information

    Raises:
        HTTP 404: If project not found or not owned by user
        HTTP 500: If update fails
    """
    try:
        project = db.query(Project).filter(
            Project.id == project_id,
            Project.user_id == current_user.id
        ).first()

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project {project_id} not found"
            )

        # Update fields if provided
        update_data = project_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(project, field, value)

        project.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(project)

        project_response = ProjectResponse.model_validate(project)
        project_response.file_count = len(project.files)

        return project_response

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update project: {str(e)}"
        )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete a project and all associated files.

    Args:
        project_id: Project ID
        current_user: Authenticated user
        db: Database session

    Raises:
        HTTP 404: If project not found or not owned by user
        HTTP 500: If deletion fails
    """
    try:
        project = db.query(Project).filter(
            Project.id == project_id,
            Project.user_id == current_user.id
        ).first()

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project {project_id} not found"
            )

        # Delete files from storage
        for file in project.files:
            if os.path.exists(file.file_path):
                os.remove(file.file_path)

        # Delete project (cascade will delete files, relationships, dashboards)
        db.delete(project)
        db.commit()

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete project: {str(e)}"
        )


@router.post("/{project_id}/files", response_model=ProjectFileUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_file_to_project(
    project_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Upload a file to a project.

    Args:
        project_id: Project ID
        file: Uploaded file (CSV or XLSX)
        current_user: Authenticated user
        db: Database session

    Returns:
        ProjectFileUploadResponse with file metadata and schema

    Raises:
        HTTP 404: If project not found
        HTTP 400: If file is invalid
        HTTP 500: If upload fails
    """
    try:
        # Verify project exists and user owns it
        project = db.query(Project).filter(
            Project.id == project_id,
            Project.user_id == current_user.id
        ).first()

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project {project_id} not found"
            )

        # Validate file type
        if not file.filename.endswith(('.csv', '.xlsx')):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only CSV and XLSX files are supported"
            )

        # Generate upload ID
        upload_id = str(uuid.uuid4())

        # Create storage directory: uploads/{user_id}/{project_id}/
        storage_dir = Path("uploads") / str(current_user.id) / str(project_id)
        storage_dir.mkdir(parents=True, exist_ok=True)

        # Save file
        file_extension = Path(file.filename).suffix
        file_path = storage_dir / f"{upload_id}{file_extension}"

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Process file with DataProcessor
        processor = DataProcessor()
        df, schema = processor.process_file(str(file_path))

        # Create file record
        new_file = FileModel(
            project_id=project_id,
            filename=file.filename,
            upload_id=upload_id,
            file_path=str(file_path),
            file_size=os.path.getsize(file_path),
            row_count=len(df),
            schema_json=schema.model_dump_json()
        )

        db.add(new_file)
        db.commit()
        db.refresh(new_file)

        # Update project's updated_at
        project.updated_at = datetime.utcnow()
        db.commit()

        return ProjectFileUploadResponse(
            file_id=new_file.id,
            upload_id=upload_id,
            filename=file.filename,
            file_size=new_file.file_size,
            row_count=new_file.row_count,
            schema=schema,
            uploaded_at=new_file.uploaded_at
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        # Clean up file if it was created
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}"
        )


@router.get("/{project_id}/files", response_model=List[FileInProject])
async def list_project_files(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List all files in a project.

    Args:
        project_id: Project ID
        current_user: Authenticated user
        db: Database session

    Returns:
        List of FileInProject objects

    Raises:
        HTTP 404: If project not found
    """
    try:
        project = db.query(Project).filter(
            Project.id == project_id,
            Project.user_id == current_user.id
        ).first()

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project {project_id} not found"
            )

        return [FileInProject.model_validate(f) for f in project.files]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list files: {str(e)}"
        )


@router.delete("/{project_id}/files/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project_file(
    project_id: int,
    file_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete a file from a project.

    Args:
        project_id: Project ID
        file_id: File ID
        current_user: Authenticated user
        db: Database session

    Raises:
        HTTP 404: If project or file not found
        HTTP 500: If deletion fails
    """
    try:
        # Verify project exists
        project = db.query(Project).filter(
            Project.id == project_id,
            Project.user_id == current_user.id
        ).first()

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project {project_id} not found"
            )

        # Find file
        file = db.query(FileModel).filter(
            FileModel.id == file_id,
            FileModel.project_id == project_id
        ).first()

        if not file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"File {file_id} not found in project {project_id}"
            )

        # Delete file from storage
        if os.path.exists(file.file_path):
            os.remove(file.file_path)

        # Delete from database
        db.delete(file)
        db.commit()

        # Update project timestamp
        project.updated_at = datetime.utcnow()
        db.commit()

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete file: {str(e)}"
        )
