"""
History API endpoints for browsing all analyses across projects.
"""

import json
import logging
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_active_user
from app.models.database import File as FileModel
from app.models.database import FileAnalysis
from app.models.database import Project as ProjectModel
from app.models.database import User
from app.models.schemas import HistoryItem, HistoryResponse

router = APIRouter(prefix="/api/history", tags=["history"])
logger = logging.getLogger(__name__)


@router.get("", response_model=HistoryResponse)
async def get_history(
    project_id: Optional[int] = Query(None, description="Filter by project ID"),
    search: Optional[str] = Query(None, description="Search in filename or user_intent"),
    date_from: Optional[datetime] = Query(None, description="Filter from date (inclusive)"),
    date_to: Optional[datetime] = Query(None, description="Filter to date (inclusive)"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get paginated analysis history for the current user.

    Supports filtering by:
    - project_id: Scope to specific project
    - search: Search in filename or user_intent
    - date_from/date_to: Date range filter

    Returns:
        HistoryResponse with paginated history items

    Raises:
        HTTP 500: If history retrieval fails
    """
    try:
        # Base query: FileAnalysis joined with File and Project
        # Filter by user ownership through Project
        query = (
            db.query(FileAnalysis, FileModel, ProjectModel)
            .join(FileModel, FileAnalysis.file_id == FileModel.id)
            .join(ProjectModel, FileModel.project_id == ProjectModel.id)
            .filter(ProjectModel.user_id == current_user.id)
        )

        # Apply filters
        if project_id is not None:
            query = query.filter(ProjectModel.id == project_id)

        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    FileModel.filename.ilike(search_pattern),
                    FileAnalysis.user_intent.ilike(search_pattern),
                )
            )

        if date_from:
            query = query.filter(FileAnalysis.created_at >= date_from)

        if date_to:
            # Include the entire end date
            query = query.filter(FileAnalysis.created_at <= date_to)

        # Get total count before pagination
        total = query.count()

        # Apply pagination and ordering
        offset = (page - 1) * page_size
        results = (
            query.order_by(desc(FileAnalysis.created_at)).offset(offset).limit(page_size).all()
        )

        # Build response items
        items: List[HistoryItem] = []
        for analysis, file, project in results:
            # Parse analysis JSON to get charts count and first insight
            charts_count = 0
            first_insight = None

            if analysis.analysis_json:
                try:
                    analysis_data = json.loads(analysis.analysis_json)
                    charts = analysis_data.get("charts", [])
                    charts_count = len(charts)

                    # Get first chart insight
                    for chart in charts:
                        insight_text = chart.get("insight")
                        if insight_text:
                            # Truncate to reasonable length
                            first_insight = (
                                insight_text[:150] + "..."
                                if len(insight_text) > 150
                                else insight_text
                            )
                            break
                except Exception as e:
                    logger.warning(f"Failed to parse analysis JSON: {e}")

            items.append(
                HistoryItem(
                    analysis_id=analysis.id,
                    file_id=file.id,
                    filename=file.filename,
                    project_id=project.id,
                    project_name=project.name,
                    charts_count=charts_count,
                    user_intent=analysis.user_intent,
                    first_insight=first_insight,
                    created_at=analysis.created_at,
                )
            )

        has_more = (page * page_size) < total

        return HistoryResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            has_more=has_more,
        )

    except Exception as e:
        logger.error(f"Failed to retrieve history: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve history: {str(e)}",
        )
