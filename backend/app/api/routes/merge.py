"""
File merging and relationship API endpoints for Phase 7C.

Handles creating relationships between files and analyzing merged datasets.
"""
import json
import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_active_user
from app.models.database import File as FileModel
from app.models.database import FileRelationship, Project, User
from app.models.schemas import (
    MergeAnalyzeRequest,
    MergeAnalyzeResponse,
    RelationshipCreate,
    RelationshipResponse,
)
from app.services.ai_service import AIService
from app.services.chart_generator import ChartGenerator
from app.services.merge_service import MergeService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/projects", tags=["merge"])


@router.post(
    "/{project_id}/relationships",
    response_model=RelationshipResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_relationship(
    project_id: int,
    relationship_data: RelationshipCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Create a relationship between two files for merging.

    Args:
        project_id: Project ID
        relationship_data: Relationship configuration
        current_user: Authenticated user
        db: Database session

    Returns:
        RelationshipResponse with created relationship info

    Raises:
        HTTP 404: If project or files not found
        HTTP 400: If files are incompatible for merge
        HTTP 500: If creation fails
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

        # Get files
        file_a = (
            db.query(FileModel)
            .filter(FileModel.id == relationship_data.file_a_id, FileModel.project_id == project_id)
            .first()
        )

        file_b = (
            db.query(FileModel)
            .filter(FileModel.id == relationship_data.file_b_id, FileModel.project_id == project_id)
            .first()
        )

        if not file_a or not file_b:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="One or both files not found in project",
            )

        # Validate merge compatibility
        merge_service = MergeService()

        df_a = merge_service.load_file(file_a.file_path)
        df_b = merge_service.load_file(file_b.file_path)

        compatibility = merge_service.validate_merge_compatibility(
            df_a, df_b, relationship_data.left_key, relationship_data.right_key
        )

        if not compatibility["compatible"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Files are not compatible for merge: "
                f"{', '.join(compatibility['warnings'])}",
            )

        # Create relationship config
        config = {
            "join_type": relationship_data.join_type,
            "left_key": relationship_data.left_key,
            "right_key": relationship_data.right_key,
            "left_suffix": relationship_data.left_suffix,
            "right_suffix": relationship_data.right_suffix,
            "compatibility": compatibility,
        }

        # Store relationship
        relationship = FileRelationship(
            project_id=project_id,
            file_a_id=file_a.id,
            file_b_id=file_b.id,
            relationship_type="merge",
            config_json=json.dumps(config),
        )

        db.add(relationship)
        db.commit()
        db.refresh(relationship)

        return RelationshipResponse.model_validate(relationship)

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create relationship: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal error occurred.",
        )


@router.get("/{project_id}/relationships", response_model=List[RelationshipResponse])
async def list_relationships(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    List all relationships in a project.

    Args:
        project_id: Project ID
        current_user: Authenticated user
        db: Database session

    Returns:
        List of RelationshipResponse objects

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

        relationships = (
            db.query(FileRelationship).filter(FileRelationship.project_id == project_id).all()
        )

        return [RelationshipResponse.model_validate(r) for r in relationships]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to list relationships: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal error occurred.",
        )


@router.delete(
    "/{project_id}/relationships/{relationship_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_relationship(
    project_id: int,
    relationship_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Delete a file relationship.

    Args:
        project_id: Project ID
        relationship_id: Relationship ID
        current_user: Authenticated user
        db: Database session

    Raises:
        HTTP 404: If project or relationship not found
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

        relationship = (
            db.query(FileRelationship)
            .filter(
                FileRelationship.id == relationship_id, FileRelationship.project_id == project_id
            )
            .first()
        )

        if not relationship:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Relationship {relationship_id} not found",
            )

        db.delete(relationship)
        db.commit()

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to delete relationship: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal error occurred.",
        )


@router.post("/{project_id}/merge-analyze", response_model=MergeAnalyzeResponse)
async def analyze_merged_data(
    project_id: int,
    merge_request: MergeAnalyzeRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Analyze merged data from a relationship and generate charts.

    Args:
        project_id: Project ID
        merge_request: Merge analyze request with relationship_id
        current_user: Authenticated user
        db: Database session

    Returns:
        MergeAnalyzeResponse with charts and insights from merged data

    Raises:
        HTTP 404: If project or relationship not found
        HTTP 500: If merge or analysis fails
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

        # Get relationship
        relationship = (
            db.query(FileRelationship)
            .filter(
                FileRelationship.id == merge_request.relationship_id,
                FileRelationship.project_id == project_id,
                FileRelationship.relationship_type == "merge",
            )
            .first()
        )

        if not relationship:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Merge relationship {merge_request.relationship_id} not found",
            )

        # Load config
        config = json.loads(relationship.config_json)

        # Get files
        file_a = db.query(FileModel).filter(FileModel.id == relationship.file_a_id).first()
        file_b = db.query(FileModel).filter(FileModel.id == relationship.file_b_id).first()

        if not file_a or not file_b:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Associated files not found"
            )

        # Merge files
        merge_service = MergeService()

        df_a = merge_service.load_file(file_a.file_path)
        df_b = merge_service.load_file(file_b.file_path)

        merged_df, merged_schema = merge_service.merge_files(
            df_a,
            df_b,
            config["left_key"],
            config["right_key"],
            config["join_type"],
            config.get("left_suffix", "_a"),
            config.get("right_suffix", "_b"),
        )

        # Generate charts from merged data
        chart_generator = ChartGenerator()
        charts_data = chart_generator.generate_charts(merged_df, merged_schema)

        # Generate AI insights
        ai_service = AIService()

        # Add insights to charts by creating new chart objects
        from app.models.schemas import ChartData

        charts_with_insights = []
        for chart_data in charts_data:
            chart_obj = ChartData(**chart_data) if isinstance(chart_data, dict) else chart_data
            insight = ai_service.generate_chart_insight(chart_obj, merged_schema)
            chart_dict = chart_obj.model_dump()
            chart_dict["insight"] = insight
            charts_with_insights.append(ChartData(**chart_dict))

        # Generate global summary
        global_summary = ai_service.generate_global_summary(
            charts=charts_with_insights,
            schema=merged_schema,
        )

        return MergeAnalyzeResponse(
            relationship_id=relationship.id,
            merged_row_count=len(merged_df),
            merged_schema=merged_schema,
            charts=charts_with_insights,
            global_summary=global_summary,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to analyze merged data: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal error occurred.",
        )
