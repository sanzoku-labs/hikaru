"""
Project management API endpoints for Phase 7.

Handles CRUD operations for projects and project files.
"""
import json
import logging
import os
import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List

import pandas as pd

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.core.exceptions import ProjectNotFoundError, ValidationError
from app.database import get_db
from app.middleware.auth import get_current_active_user
from app.models.database import File as FileModel

logger = logging.getLogger(__name__)
from app.models.database import Project, User
from app.models.schemas import (
    AnalysisHistoryItem,
    AnalysisHistoryResponse,
    AnalysisListResponse,
    ErrorResponse,
    FileAnalysisResponse,
    FileAnalyzeRequest,
    FileInProject,
    ProjectCreate,
    ProjectFileUploadResponse,
    ProjectListResponse,
    ProjectResponse,
    ProjectUpdate,
    SavedAnalysisDetail,
    SavedAnalysisSummary,
    SheetInfo,
)
from app.services.ai_service import AIService
from app.services.chart_generator import ChartGenerator
from app.services.data_processor import DataProcessor
from app.services.project_service import ProjectService

router = APIRouter(prefix="/api/projects", tags=["projects"])


# Custom JSON encoder to handle Pandas Timestamps and other special types
class CustomJSONEncoder(json.JSONEncoder):
    """JSON encoder that handles Pandas Timestamps and numpy types."""

    def default(self, obj):
        # Handle Pandas Timestamp
        if isinstance(obj, pd.Timestamp):
            return obj.isoformat()

        # Handle standard datetime
        if isinstance(obj, datetime):
            return obj.isoformat()

        # Handle pandas NA/NaT
        if pd.isna(obj):
            return None

        return super().default(obj)


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
        project_service = ProjectService(db)
        new_project = project_service.create_project(
            user_id=current_user.id,
            name=project_data.name,
            description=project_data.description,
        )

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

    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e.detail))
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
        project_service = ProjectService(db)
        projects = project_service.list_user_projects(
            user_id=current_user.id, include_archived=include_archived
        )

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
        project_service = ProjectService(db)
        project = project_service.get_project(project_id=project_id, user_id=current_user.id)

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

    except ProjectNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e.detail))
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
        HTTP 400: If update data is invalid
        HTTP 500: If update fails
    """
    try:
        project_service = ProjectService(db)

        # Update fields if provided
        update_data = project_data.model_dump(exclude_unset=True)
        project = project_service.update_project(
            project_id=project_id, user_id=current_user.id, **update_data
        )

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

    except ProjectNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e.detail))
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e.detail))
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
        project_service = ProjectService(db)

        # Get project first to access files for cleanup
        project = project_service.get_project(project_id=project_id, user_id=current_user.id)

        # Delete files from storage
        for file in project.files:
            if os.path.exists(file.file_path):
                os.remove(file.file_path)

        # Delete project (cascade will delete files, relationships, dashboards)
        project_service.delete_project(project_id=project_id, user_id=current_user.id)

    except ProjectNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e.detail))
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
        project_service = ProjectService(db)

        # Verify project exists and user owns it
        project = project_service.get_project(project_id=project_id, user_id=current_user.id)

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

        # For Excel files: only extract metadata, no DataFrame parsing
        if file_ext in ["xlsx", "xls"]:
            # Get sheet metadata using openpyxl (fast, read-only)
            try:
                sheet_list = processor.get_excel_sheets(str(file_path))
                # Store basic file info, no data schema yet
                row_count = None
                schema = None
                available_sheets_json = json.dumps(sheet_list)
            except Exception as e:
                if os.path.exists(file_path):
                    os.remove(file_path)
                raise HTTPException(status_code=400, detail=f"Invalid Excel file: {str(e)}")
        else:
            # CSV: keep existing behavior (immediate validation)
            df = processor.parse_file(str(file_path), file_ext)
            is_valid, error_msg = processor.validate_dataframe(df)
            if not is_valid:
                if os.path.exists(file_path):
                    os.remove(file_path)
                raise HTTPException(status_code=400, detail=error_msg)
            schema = processor.analyze_schema(df)
            row_count = len(df)
            available_sheets_json = None

        # Create file record
        new_file = FileModel(
            project_id=project_id,
            filename=file.filename,
            upload_id=upload_id,
            file_path=str(file_path),
            file_size=os.path.getsize(file_path),
            row_count=row_count,
            schema_json=schema.model_dump_json() if schema else None,
            available_sheets_json=available_sheets_json,
        )

        db.add(new_file)
        db.commit()
        db.refresh(new_file)

        # Update project's updated_at
        project.updated_at = datetime.now(timezone.utc)
        db.commit()

        return ProjectFileUploadResponse(
            file_id=new_file.id,
            upload_id=upload_id,
            filename=file.filename,
            file_size=new_file.file_size,
            row_count=row_count,
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
        project_service = ProjectService(db)
        project = project_service.get_project(project_id=project_id, user_id=current_user.id)

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

    except ProjectNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e.detail))
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
        project_service = ProjectService(db)

        # Verify project exists
        project = project_service.get_project(project_id=project_id, user_id=current_user.id)

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
        project.updated_at = datetime.now(timezone.utc)
        db.commit()

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete file: {str(e)}",
        )


@router.get("/{project_id}/files/{file_id}/download")
async def download_project_file(
    project_id: int,
    file_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Download the original uploaded file (CSV/XLSX).

    Args:
        project_id: Project ID
        file_id: File ID
        current_user: Authenticated user
        db: Database session

    Returns:
        FileResponse with original file

    Raises:
        HTTP 404: If project or file not found
        HTTP 404: If file not found on disk
    """
    from fastapi.responses import FileResponse

    try:
        project_service = ProjectService(db)

        # Verify project exists and user owns it
        project = project_service.get_project(project_id=project_id, user_id=current_user.id)

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

        # Check if file exists on disk
        if not os.path.exists(file.file_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"File not found on disk: {file.filename}",
            )

        # Return file with proper headers for download
        return FileResponse(
            path=file.file_path,
            filename=file.filename,
            media_type="application/octet-stream",
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to download file: {str(e)}",
        )


@router.get("/{project_id}/files/{file_id}/sheets", response_model=List[SheetInfo])
async def get_file_sheets(
    project_id: int,
    file_id: int,
    preview: bool = Query(True, description="Include data preview (first 3 rows)"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get list of all sheets in an Excel file with optional preview data.

    Args:
        project_id: Project ID
        file_id: File ID
        preview: If True, includes first 3 rows of data for each sheet
        current_user: Authenticated user
        db: Database session

    Returns:
        List of SheetInfo with sheet metadata and optional preview data

    Raises:
        HTTP 400: If file is not an Excel workbook
        HTTP 404: If project or file not found
        HTTP 500: If sheet detection fails
    """
    try:
        project_service = ProjectService(db)

        # Verify project exists and user owns it
        project = project_service.get_project(project_id=project_id, user_id=current_user.id)

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

        # Check if file is Excel
        if not file.filename.lower().endswith(('.xlsx', '.xls')):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File is not an Excel workbook",
            )

        # Check if file exists on disk
        if not os.path.exists(file.file_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"File not found on disk: {file.file_path}",
            )

        # Get sheet metadata
        processor = DataProcessor()
        sheets = processor.get_excel_sheets(file.file_path)

        # Optionally add preview data for each sheet
        if preview:
            file_ext = Path(file.filename).suffix.lstrip(".")
            for sheet in sheets:
                try:
                    # Parse just this sheet
                    df = processor.parse_file(file.file_path, file_ext, sheet_name=sheet['name'])

                    # Add preview (first 3 rows)
                    sheet['preview'] = df.head(3).to_dict('records')

                    # Check if has numeric columns
                    numeric_cols = df.select_dtypes(include=['number']).columns
                    sheet['has_numeric'] = len(numeric_cols) > 0

                except Exception as e:
                    # If this sheet fails, add error but continue with other sheets
                    sheet['error'] = f"Failed to load sheet: {str(e)}"
                    sheet['preview'] = None
                    sheet['has_numeric'] = False

        return sheets

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get sheets for file {file_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get file sheets: {str(e)}",
        )


@router.post("/{project_id}/files/{file_id}/analyze", response_model=FileAnalysisResponse)
async def analyze_project_file(
    project_id: int,
    file_id: int,
    request: FileAnalyzeRequest,
    save: bool = True,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Analyze a file in a project, generating charts and AI insights.
    Results can be saved to database or returned as temporary analysis.

    Args:
        project_id: Project ID
        file_id: File ID
        request: Analysis request with optional user intent
        save: If True, saves analysis to database. If False, returns temporary analysis
        current_user: Authenticated user
        db: Database session

    Returns:
        FileAnalysisResponse with charts, insights, and metadata

    Raises:
        HTTP 404: If project or file not found
        HTTP 500: If analysis fails
    """
    try:
        project_service = ProjectService(db)

        # Verify project exists and user owns it
        project = project_service.get_project(project_id=project_id, user_id=current_user.id)

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

        # Check if file exists
        if not os.path.exists(file.file_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"File not found on disk: {file.file_path}",
            )

        # Parse file with optional sheet selection
        df = processor.parse_file(file.file_path, file_ext, sheet_name=request.sheet_name)

        # Validate the dataframe (check for sufficient data and numeric columns)
        is_valid, error_msg = processor.validate_dataframe(df)
        if not is_valid:
            # Return a user-friendly error for insufficient data in this sheet
            sheet_info = f" (sheet: {request.sheet_name})" if request.sheet_name else ""
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot analyze this sheet{sheet_info}: {error_msg}. Please select a different sheet with sufficient data and at least one numeric column."
            )

        # Parse schema from stored JSON
        schema = processor.analyze_schema(df)

        # Use AnalysisService for AI-powered chart generation with user intent support
        from app.services.analysis_service import AnalysisService

        analysis_service = AnalysisService()
        analysis_result = analysis_service.perform_full_analysis(
            df=df,
            schema=schema,
            user_intent=request.user_intent,  # Pass user intent for AI-powered suggestions
            max_charts=4
        )

        charts_with_insights = analysis_result["charts"]
        global_summary = analysis_result["global_summary"]

        # Conditional save: only save to database if save=True
        if save:
            # Store analysis results in FileAnalysis table
            from app.models.database import FileAnalysis

            analysis_json_dict = {
                "charts": [chart.model_dump() for chart in charts_with_insights],
                "global_summary": global_summary,
                "schema": schema.model_dump(),
            }

            file_analysis = FileAnalysis(
                file_id=file.id,
                analysis_json=json.dumps(analysis_json_dict, cls=CustomJSONEncoder),
                user_intent=request.user_intent,
                sheet_name=request.sheet_name,  # Store which sheet was analyzed
            )

            db.add(file_analysis)
            db.commit()
            db.refresh(file_analysis)
            analyzed_at = file_analysis.created_at
        else:
            # Return temporary analysis without saving
            analyzed_at = datetime.now(timezone.utc)

        return FileAnalysisResponse(
            file_id=file.id,
            filename=file.filename,
            charts=charts_with_insights,
            global_summary=global_summary,
            user_intent=request.user_intent,
            analyzed_at=analyzed_at,
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to analyze file {file_id} in project {project_id}: {str(e)}", exc_info=True)
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
        project_service = ProjectService(db)

        # Verify project exists and user owns it
        project = project_service.get_project(project_id=project_id, user_id=current_user.id)

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
        project_service = ProjectService(db)

        # Verify project exists and user owns it
        project = project_service.get_project(project_id=project_id, user_id=current_user.id)

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


# ===== Multi-Analysis Endpoints (FileAnalysis table) =====


@router.get("/{project_id}/files/{file_id}/analyses", response_model=AnalysisListResponse)
async def list_file_analyses(
    project_id: int,
    file_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    List all saved analyses for a file.

    Args:
        project_id: Project ID
        file_id: File ID
        current_user: Authenticated user
        db: Database session

    Returns:
        AnalysisListResponse with list of saved analyses
    """
    try:
        from app.models.database import FileAnalysis
        from app.models.schemas import SavedAnalysisSummary, ChartData

        project_service = ProjectService(db)

        # Verify project exists and user owns it
        project = project_service.get_project(project_id=project_id, user_id=current_user.id)

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

        # Get all analyses for this file
        file_analyses = (
            db.query(FileAnalysis)
            .filter(FileAnalysis.file_id == file_id)
            .order_by(FileAnalysis.created_at.desc())
            .all()
        )

        # Build summary list
        summaries = []
        for analysis in file_analyses:
            analysis_data = json.loads(analysis.analysis_json)
            charts_count = len(analysis_data.get("charts", []))

            summaries.append(
                SavedAnalysisSummary(
                    analysis_id=analysis.id,
                    user_intent=analysis.user_intent,
                    charts_count=charts_count,
                    created_at=analysis.created_at,
                )
            )

        return AnalysisListResponse(
            file_id=file.id,
            filename=file.filename,
            total_analyses=len(summaries),
            analyses=summaries,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to list analyses for file {file_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list analyses: {str(e)}",
        )


@router.get(
    "/{project_id}/files/{file_id}/analyses/{analysis_id}",
    response_model=SavedAnalysisDetail,
)
async def get_file_analysis(
    project_id: int,
    file_id: int,
    analysis_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get a specific saved analysis.

    Args:
        project_id: Project ID
        file_id: File ID
        analysis_id: Analysis ID
        current_user: Authenticated user
        db: Database session

    Returns:
        SavedAnalysisDetail with full analysis data
    """
    try:
        from app.models.database import FileAnalysis
        from app.models.schemas import ChartData

        project_service = ProjectService(db)

        # Verify project exists and user owns it
        project = project_service.get_project(project_id=project_id, user_id=current_user.id)

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

        # Find analysis
        analysis = (
            db.query(FileAnalysis)
            .filter(FileAnalysis.id == analysis_id, FileAnalysis.file_id == file_id)
            .first()
        )

        if not analysis:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Analysis {analysis_id} not found",
            )

        # Parse analysis data
        analysis_data = json.loads(analysis.analysis_json)
        charts = [ChartData(**chart) for chart in analysis_data.get("charts", [])]

        return SavedAnalysisDetail(
            analysis_id=analysis.id,
            file_id=file.id,
            filename=file.filename,
            charts=charts,
            global_summary=analysis_data.get("global_summary"),
            user_intent=analysis.user_intent,
            created_at=analysis.created_at,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Failed to get analysis {analysis_id} for file {file_id}: {str(e)}", exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get analysis: {str(e)}",
        )


@router.delete(
    "/{project_id}/files/{file_id}/analyses/{analysis_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_file_analysis(
    project_id: int,
    file_id: int,
    analysis_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Delete a saved analysis.

    Args:
        project_id: Project ID
        file_id: File ID
        analysis_id: Analysis ID
        current_user: Authenticated user
        db: Database session

    Returns:
        No content (204)
    """
    try:
        from app.models.database import FileAnalysis

        project_service = ProjectService(db)

        # Verify project exists and user owns it
        project = project_service.get_project(project_id=project_id, user_id=current_user.id)

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

        # Find analysis
        analysis = (
            db.query(FileAnalysis)
            .filter(FileAnalysis.id == analysis_id, FileAnalysis.file_id == file_id)
            .first()
        )

        if not analysis:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Analysis {analysis_id} not found",
            )

        # Delete analysis
        db.delete(analysis)
        db.commit()

        logger.info(
            f"Deleted analysis {analysis_id} for file {file_id} in project {project_id}"
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(
            f"Failed to delete analysis {analysis_id} for file {file_id}: {str(e)}", exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete analysis: {str(e)}",
        )
