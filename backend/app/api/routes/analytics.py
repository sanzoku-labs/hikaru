"""
Analytics API endpoints for cross-project metrics and dashboard.
"""

import json
import logging
from datetime import datetime, timedelta, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_active_user
from app.models.database import File as FileModel
from app.models.database import Project as ProjectModel
from app.models.database import User
from app.models.schemas import (
    AnalyticsResponse,
    ChartDistribution,
    RecentAnalysis,
    TopInsight,
)

router = APIRouter(prefix="/api/analytics", tags=["analytics"])
logger = logging.getLogger(__name__)


@router.get("", response_model=AnalyticsResponse)
async def get_analytics(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get analytics dashboard metrics for the current user.

    Returns:
        AnalyticsResponse with aggregated statistics:
        - Total projects, files, analyses
        - Trends (percentage change from previous period)
        - Recent analyses (last 10)
        - Chart type distribution
        - Top insights

    Raises:
        HTTP 500: If analytics calculation fails
    """
    try:
        # Calculate current period (last 30 days) and previous period
        now = datetime.now(timezone.utc)
        current_period_start = now - timedelta(days=30)
        previous_period_start = now - timedelta(days=60)

        # Total counts
        total_projects = (
            db.query(ProjectModel)
            .filter(ProjectModel.user_id == current_user.id)
            .count()
        )

        total_files = (
            db.query(FileModel)
            .join(ProjectModel)
            .filter(ProjectModel.user_id == current_user.id)
            .count()
        )

        total_analyses = (
            db.query(FileModel)
            .join(ProjectModel)
            .filter(
                ProjectModel.user_id == current_user.id,
                FileModel.analysis_timestamp.isnot(None),
            )
            .count()
        )

        # Trends (comparing last 30 days vs previous 30 days)
        current_projects = (
            db.query(ProjectModel)
            .filter(
                ProjectModel.user_id == current_user.id,
                ProjectModel.created_at >= current_period_start,
            )
            .count()
        )

        previous_projects = (
            db.query(ProjectModel)
            .filter(
                ProjectModel.user_id == current_user.id,
                ProjectModel.created_at >= previous_period_start,
                ProjectModel.created_at < current_period_start,
            )
            .count()
        )

        projects_trend = (
            ((current_projects - previous_projects) / previous_projects * 100)
            if previous_projects > 0
            else (100.0 if current_projects > 0 else 0.0)
        )

        current_files = (
            db.query(FileModel)
            .join(ProjectModel)
            .filter(
                ProjectModel.user_id == current_user.id,
                FileModel.uploaded_at >= current_period_start,
            )
            .count()
        )

        previous_files = (
            db.query(FileModel)
            .join(ProjectModel)
            .filter(
                ProjectModel.user_id == current_user.id,
                FileModel.uploaded_at >= previous_period_start,
                FileModel.uploaded_at < current_period_start,
            )
            .count()
        )

        files_trend = (
            ((current_files - previous_files) / previous_files * 100)
            if previous_files > 0
            else (100.0 if current_files > 0 else 0.0)
        )

        current_analyses = (
            db.query(FileModel)
            .join(ProjectModel)
            .filter(
                ProjectModel.user_id == current_user.id,
                FileModel.analysis_timestamp >= current_period_start,
            )
            .count()
        )

        previous_analyses = (
            db.query(FileModel)
            .join(ProjectModel)
            .filter(
                ProjectModel.user_id == current_user.id,
                FileModel.analysis_timestamp >= previous_period_start,
                FileModel.analysis_timestamp < current_period_start,
            )
            .count()
        )

        analyses_trend = (
            ((current_analyses - previous_analyses) / previous_analyses * 100)
            if previous_analyses > 0
            else (100.0 if current_analyses > 0 else 0.0)
        )

        # Recent analyses (last 10)
        recent_files = (
            db.query(FileModel, ProjectModel)
            .join(ProjectModel)
            .filter(
                ProjectModel.user_id == current_user.id,
                FileModel.analysis_timestamp.isnot(None),
            )
            .order_by(FileModel.analysis_timestamp.desc())
            .limit(10)
            .all()
        )

        recent_analyses = []
        for file, project in recent_files:
            # Count charts from analysis_json
            charts_count = 0
            if file.analysis_json:
                try:
                    analysis_data = json.loads(file.analysis_json)
                    charts_count = len(analysis_data.get("charts", []))
                except Exception:
                    pass

            recent_analyses.append(
                RecentAnalysis(
                    file_id=file.id,
                    filename=file.filename,
                    project_id=project.id,
                    project_name=project.name,
                    analyzed_at=file.analysis_timestamp,
                    charts_count=charts_count,
                )
            )

        # Chart type distribution
        chart_dist = ChartDistribution()
        analyzed_files = (
            db.query(FileModel)
            .join(ProjectModel)
            .filter(
                ProjectModel.user_id == current_user.id,
                FileModel.analysis_json.isnot(None),
            )
            .all()
        )

        for file in analyzed_files:
            try:
                analysis_data = json.loads(file.analysis_json)
                charts = analysis_data.get("charts", [])
                for chart in charts:
                    chart_type = chart.get("chart_type", "")
                    if chart_type == "line":
                        chart_dist.line += 1
                    elif chart_type == "bar":
                        chart_dist.bar += 1
                    elif chart_type == "pie":
                        chart_dist.pie += 1
                    elif chart_type == "scatter":
                        chart_dist.scatter += 1
            except Exception:
                continue

        # Top insights (extract from chart insights)
        top_insights: List[TopInsight] = []
        for file, project in recent_files[:5]:  # Top 5 most recent
            if file.analysis_json:
                try:
                    analysis_data = json.loads(file.analysis_json)
                    charts = analysis_data.get("charts", [])

                    # Get first chart with insight
                    for chart in charts:
                        insight_text = chart.get("insight")
                        if insight_text:
                            top_insights.append(
                                TopInsight(
                                    file_id=file.id,
                                    filename=file.filename,
                                    project_name=project.name,
                                    insight=insight_text,
                                    analyzed_at=file.analysis_timestamp,
                                )
                            )
                            break  # Only one insight per file
                except Exception:
                    continue

        return AnalyticsResponse(
            total_projects=total_projects,
            total_files=total_files,
            total_analyses=total_analyses,
            projects_trend=round(projects_trend, 1),
            files_trend=round(files_trend, 1),
            analyses_trend=round(analyses_trend, 1),
            recent_analyses=recent_analyses,
            chart_type_distribution=chart_dist,
            top_insights=top_insights,
        )

    except Exception as e:
        logger.error(f"Failed to calculate analytics: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate analytics: {str(e)}",
        )
