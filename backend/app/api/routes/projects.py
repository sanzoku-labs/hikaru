"""
Project management API endpoints for Phase 7.

Handles CRUD operations for projects and project files.
"""
import json
import os
import shutil
import uuid
from datetime import datetime
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_active_user
from app.models.database import File as FileModel
from app.models.database import Project, User
from app.models.schemas import (
    AnalysisHistoryItem,
    AnalysisHistoryResponse,
    ErrorResponse,
    FileAnalysisResponse,
    FileAnalyzeRequest,
    FileInProject,
    ProjectCreate,
    ProjectFileUploadResponse,
    ProjectListResponse,
    ProjectResponse,
    ProjectUpdate,
)
from app.services.ai_service import AIService
from app.services.chart_generator import ChartGenerator
from app.services.data_processor import DataProcessor

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
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
            name=project_data.name, description=project_data.description, user_id=current_user.id
        )

        db.add(new_project)
        db.commit()
        db.refresh(new_project)

        # Return project with file_count = 0
        project_dict = {
            "id": new_project.id,
            "name": new_project.name,
            "description": new_project.description,
            "user_id": new_project.user_id,
            "created_at": new_project.created_at,
            "updated_at": new_project.updated_at,
            "is_archived": new_project.is_archived,
            "file_count": 0,
            "files": None,
        }
        return ProjectResponse(**project_dict)

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create project: {str(e)}",
        )


@router.get("", response_model=ProjectListResponse)
async def list_projects(
    include_archived: bool = False,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
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
            # Convert to dict to avoid SQLAlchemy relationship loading issues
            project_dict = {
                "id": project.id,
                "name": project.name,
                "description": project.description,
                "user_id": project.user_id,
                "created_at": project.created_at,
                "updated_at": project.updated_at,
                "is_archived": project.is_archived,
                "file_count": len(project.files) if project.files else 0,
                "files": None,  # Don't include files in list view
            }
            project_response = ProjectResponse(**project_dict)
            project_responses.append(project_response)

        return ProjectListResponse(projects=project_responses, total=len(project_responses))

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list projects: {str(e)}",
        )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
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
        project = (
            db.query(Project)
            .filter(Project.id == project_id, Project.user_id == current_user.id)
            .first()
        )

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {project_id} not found"
            )

        # Populate files with analysis status
        files_with_analysis = []
        for f in project.files:
            file_dict = {
                "id": f.id,
                "project_id": f.project_id,
                "filename": f.filename,
                "upload_id": f.upload_id,
                "file_size": f.file_size,
                "row_count": f.row_count,
                "data_schema_json": f.schema_json,
                "uploaded_at": f.uploaded_at,
                "has_analysis": f.analysis_json is not None,
                "analyzed_at": f.analysis_timestamp,
            }
            files_with_analysis.append(FileInProject(**file_dict))

        # Build project response
        project_dict = {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "user_id": project.user_id,
            "created_at": project.created_at,
            "updated_at": project.updated_at,
            "is_archived": project.is_archived,
            "file_count": len(project.files),
            "files": files_with_analysis,
        }

        return ProjectResponse(**project_dict)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get project: {str(e)}",
        )


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
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
        project = (
            db.query(Project)
            .filter(Project.id == project_id, Project.user_id == current_user.id)
            .first()
        )

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {project_id} not found"
            )

        # Update fields if provided
        update_data = project_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(project, field, value)

        project.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(project)

        # Build project response
        project_dict = {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "user_id": project.user_id,
            "created_at": project.created_at,
            "updated_at": project.updated_at,
            "is_archived": project.is_archived,
            "file_count": len(project.files),
            "files": None,
        }
        return ProjectResponse(**project_dict)

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update project: {str(e)}",
        )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
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
        project = (
            db.query(Project)
            .filter(Project.id == project_id, Project.user_id == current_user.id)
            .first()
        )

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {project_id} not found"
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
            detail=f"Failed to delete project: {str(e)}",
        )


@router.post(
    "/{project_id}/files",
    response_model=ProjectFileUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_file_to_project(
    project_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
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
        project = (
            db.query(Project)
            .filter(Project.id == project_id, Project.user_id == current_user.id)
            .first()
        )

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {project_id} not found"
            )

        # Validate file type
        if not file.filename.endswith((".csv", ".xlsx")):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only CSV and XLSX files are supported",
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
        file_ext = Path(file.filename).suffix.lstrip(".")
        df = processor.parse_file(str(file_path), file_ext)

        # Validate dataframe
        is_valid, error_msg = processor.validate_dataframe(df)
        if not is_valid:
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(status_code=400, detail=error_msg)

        # Generate schema
        schema = processor.analyze_schema(df)

        # Create file record
        new_file = FileModel(
            project_id=project_id,
            filename=file.filename,
            upload_id=upload_id,
            file_path=str(file_path),
            file_size=os.path.getsize(file_path),
            row_count=len(df),
            schema_json=schema.model_dump_json(),
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
            data_schema=schema,
            uploaded_at=new_file.uploaded_at,
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        # Clean up file if it was created
        if "file_path" in locals() and os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}",
        )


@router.get("/{project_id}/files", response_model=List[FileInProject])
async def list_project_files(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
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
        project = (
            db.query(Project)
            .filter(Project.id == project_id, Project.user_id == current_user.id)
            .first()
        )

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {project_id} not found"
            )

        # Populate files with analysis status
        files_with_analysis = []
        for f in project.files:
            file_dict = {
                "id": f.id,
                "project_id": f.project_id,
                "filename": f.filename,
                "upload_id": f.upload_id,
                "file_size": f.file_size,
                "row_count": f.row_count,
                "data_schema_json": f.schema_json,
                "uploaded_at": f.uploaded_at,
                "has_analysis": f.analysis_json is not None,
                "analyzed_at": f.analysis_timestamp,
            }
            files_with_analysis.append(FileInProject(**file_dict))

        return files_with_analysis

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list files: {str(e)}",
        )


@router.delete("/{project_id}/files/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project_file(
    project_id: int,
    file_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
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
        project = (
            db.query(Project)
            .filter(Project.id == project_id, Project.user_id == current_user.id)
            .first()
        )

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {project_id} not found"
            )

        # Find file
        file = (
            db.query(FileModel)
            .filter(FileModel.id == file_id, FileModel.project_id == project_id)
            .first()
        )

        if not file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"File {file_id} not found in project {project_id}",
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
            detail=f"Failed to delete file: {str(e)}",
        )


@router.post("/{project_id}/files/{file_id}/analyze", response_model=FileAnalysisResponse)
async def analyze_project_file(
    project_id: int,
    file_id: int,
    request: FileAnalyzeRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Analyze a file in a project, generating charts and AI insights.
    Results are saved to the database for fast retrieval.

    Args:
        project_id: Project ID
        file_id: File ID
        request: Analysis request with optional user intent
        current_user: Authenticated user
        db: Database session

    Returns:
        FileAnalysisResponse with charts, insights, and metadata

    Raises:
        HTTP 404: If project or file not found
        HTTP 500: If analysis fails
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

        # Find file
        file = (
            db.query(FileModel)
            .filter(FileModel.id == file_id, FileModel.project_id == project_id)
            .first()
        )

        if not file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"File {file_id} not found in project {project_id}",
            )

        # Load the dataframe
        processor = DataProcessor()
        file_ext = Path(file.filename).suffix.lstrip(".")
        df = processor.parse_file(file.file_path, file_ext)

        # Parse schema from stored JSON
        schema = processor.analyze_schema(df)

        # Generate charts
        chart_generator = ChartGenerator()
        charts_data_raw = chart_generator.generate_charts(
            df, schema, user_intent=request.user_intent
        )

        # Generate AI insights
        ai_service = AIService()

        # Add insights to charts by creating new chart objects with insights
        from app.models.schemas import ChartData

        charts_with_insights = []
        for chart_data in charts_data_raw:
            # Generate insight for this chart
            insight = ai_service.generate_chart_insight(chart_data, schema)

            # Create new chart dict with insight
            chart_dict = chart_data if isinstance(chart_data, dict) else chart_data.model_dump()
            chart_dict["insight"] = insight
            charts_with_insights.append(ChartData(**chart_dict))

        # Generate global summary
        global_summary = ai_service.generate_global_summary(
            charts_with_insights, schema, user_intent=request.user_intent
        )

        # Store analysis results in database
        analysis_json = {
            "charts": [chart.model_dump() for chart in charts_with_insights],
            "global_summary": global_summary,
            "schema": schema.model_dump(),
        }

        file.analysis_json = json.dumps(analysis_json)
        file.analysis_timestamp = datetime.utcnow()
        file.user_intent = request.user_intent

        db.commit()
        db.refresh(file)

        return FileAnalysisResponse(
            file_id=file.id,
            filename=file.filename,
            charts=charts_with_insights,
            global_summary=global_summary,
            user_intent=request.user_intent,
            analyzed_at=file.analysis_timestamp,
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze file: {str(e)}",
        )


@router.get("/{project_id}/files/{file_id}/analysis", response_model=FileAnalysisResponse)
async def get_project_file_analysis(
    project_id: int,
    file_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get saved analysis results for a file in a project.

    Args:
        project_id: Project ID
        file_id: File ID
        current_user: Authenticated user
        db: Database session

    Returns:
        FileAnalysisResponse with saved analysis results

    Raises:
        HTTP 404: If project, file, or analysis not found
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

        # Find file
        file = (
            db.query(FileModel)
            .filter(FileModel.id == file_id, FileModel.project_id == project_id)
            .first()
        )

        if not file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"File {file_id} not found in project {project_id}",
            )

        # Check if analysis exists
        if not file.analysis_json:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No analysis found for file {file_id}. Please analyze the file first.",
            )

        # Parse stored analysis
        analysis_data = json.loads(file.analysis_json)

        # Import ChartData for deserialization
        from app.models.schemas import ChartData

        charts = [ChartData(**chart) for chart in analysis_data["charts"]]

        return FileAnalysisResponse(
            file_id=file.id,
            filename=file.filename,
            charts=charts,
            global_summary=analysis_data.get("global_summary"),
            user_intent=file.user_intent,
            analyzed_at=file.analysis_timestamp,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve analysis: {str(e)}",
        )


@router.get(
    "/{project_id}/files/{file_id}/analysis-history", response_model=AnalysisHistoryResponse
)
async def get_analysis_history(
    project_id: int,
    file_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get analysis history for a file (Mockup 3 - Saved Analyses).

    Returns all saved analysis sessions for a specific file.
    Currently returns the single latest analysis (future: support versioning).

    Args:
        project_id: Project ID
        file_id: File ID
        current_user: Authenticated user
        db: Database session

    Returns:
        AnalysisHistoryResponse with list of analysis sessions

    Raises:
        HTTP 404: If project or file not found
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

        # Find file
        file = (
            db.query(FileModel)
            .filter(FileModel.id == file_id, FileModel.project_id == project_id)
            .first()
        )

        if not file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"File {file_id} not found in project {project_id}",
            )

        # Build analysis history
        analyses = []

        if file.analysis_json and file.analysis_timestamp:
            # Parse analysis to get metadata
            analysis_data = json.loads(file.analysis_json)
            charts_count = len(analysis_data.get("charts", []))
            has_summary = analysis_data.get("global_summary") is not None

            # Generate analysis ID from timestamp
            analysis_id = f"analysis_{file.id}_{int(file.analysis_timestamp.timestamp())}"

            analyses.append(
                AnalysisHistoryItem(
                    analysis_id=analysis_id,
                    file_id=file.id,
                    filename=file.filename,
                    charts_count=charts_count,
                    user_intent=file.user_intent,
                    analyzed_at=file.analysis_timestamp,
                    has_global_summary=has_summary,
                )
            )

        return AnalysisHistoryResponse(
            file_id=file.id, filename=file.filename, total_analyses=len(analyses), analyses=analyses
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve analysis history: {str(e)}",
        )
