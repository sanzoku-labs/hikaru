"""
File comparison API endpoints for Phase 7B.

Handles comparing two files within a project.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.middleware.auth import get_current_active_user
from app.models.schemas import (
    ComparisonRequest,
    ComparisonResponse,
    FileInProject
)
from app.models.database import User, Project, File as FileModel, FileRelationship
from app.services.comparison_service import ComparisonService
from app.services.ai_service import AIService
import json

router = APIRouter(prefix="/api/projects", tags=["comparison"])


@router.post("/{project_id}/compare", response_model=ComparisonResponse)
async def compare_files(
    project_id: int,
    comparison_data: ComparisonRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Compare two files in a project.

    Args:
        project_id: Project ID
        comparison_data: Comparison request (file_a_id, file_b_id, comparison_type)
        current_user: Authenticated user
        db: Database session

    Returns:
        ComparisonResponse with overlay charts and insights

    Raises:
        HTTP 404: If project or files not found
        HTTP 400: If files are incompatible
        HTTP 500: If comparison fails
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

        # Get files
        file_a = db.query(FileModel).filter(
            FileModel.id == comparison_data.file_a_id,
            FileModel.project_id == project_id
        ).first()

        file_b = db.query(FileModel).filter(
            FileModel.id == comparison_data.file_b_id,
            FileModel.project_id == project_id
        ).first()

        if not file_a or not file_b:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="One or both files not found in project"
            )

        # Load and compare files
        comparison_service = ComparisonService()

        df_a = comparison_service.load_file(file_a.file_path)
        df_b = comparison_service.load_file(file_b.file_path)

        # Generate overlay charts
        overlay_charts = comparison_service.generate_overlay_charts(
            df_a, df_b,
            file_a.filename, file_b.filename,
            comparison_data.comparison_type
        )

        if not overlay_charts:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Files have no compatible columns for comparison"
            )

        # Calculate metrics
        metrics = comparison_service.calculate_metrics(df_a, df_b)

        # Generate AI comparison insights
        ai_service = AIService()
        summary_insight = await ai_service.generate_comparison_insight(
            file_a_name=file_a.filename,
            file_b_name=file_b.filename,
            metrics=metrics,
            comparison_type=comparison_data.comparison_type
        )

        # Add insights to charts
        for i, chart in enumerate(overlay_charts):
            if i < len(overlay_charts):
                chart_insight = await ai_service.generate_chart_comparison_insight(
                    chart=chart,
                    metrics=metrics
                )
                chart.comparison_insight = chart_insight

        # Store comparison relationship
        relationship_config = {
            "comparison_type": comparison_data.comparison_type,
            "charts_generated": len(overlay_charts),
            "metrics": metrics
        }

        relationship = FileRelationship(
            project_id=project_id,
            file_a_id=file_a.id,
            file_b_id=file_b.id,
            relationship_type="comparison",
            config_json=json.dumps(relationship_config)
        )

        db.add(relationship)
        db.commit()
        db.refresh(relationship)

        return ComparisonResponse(
            comparison_id=relationship.id,
            file_a=FileInProject.model_validate(file_a),
            file_b=FileInProject.model_validate(file_b),
            comparison_type=comparison_data.comparison_type,
            overlay_charts=overlay_charts,
            summary_insight=summary_insight,
            created_at=relationship.created_at
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compare files: {str(e)}"
        )
