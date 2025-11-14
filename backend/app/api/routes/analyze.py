import logging
import os
from datetime import datetime
from typing import Optional

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.schemas import AnalyzeResponse, ChartData
from app.services.ai_service import AIService
from app.services.chart_generator import ChartGenerator
from app.services.data_processor import DataProcessor
from app.services.upload_service import UploadService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["analyze"])


@router.get("/analyze/{upload_id}", response_model=AnalyzeResponse)
async def analyze_data(
    upload_id: str,
    user_intent: Optional[str] = Query(
        None, description="Optional: What the user wants to analyze"
    ),
    db: Session = Depends(get_db),
):
    """
    Analyze uploaded file and generate charts with AI-powered suggestions.

    Takes an upload_id from a previous /upload call and:
    1. Uses AI to intelligently suggest 3-4 meaningful charts (with optional user intent)
    2. Generates charts based on AI suggestions (fallback to heuristics if AI unavailable)
    3. Generates AI insights for each chart (if API key configured)
    4. Generates global summary (if API key configured)
    """

    # Get upload data from database using UploadService
    upload_service = UploadService(db)
    upload_data = upload_service.get_upload(upload_id)

    try:
        # Get data from storage (already parsed)
        df = upload_data["dataframe"]
        schema = upload_data["schema"]
        filename = upload_data["filename"]

        logger.info(
            f"Starting analysis for upload_id={upload_id}, filename={filename}, user_intent={user_intent}"
        )
        logger.info(f"Dataset: {schema.row_count} rows, {len(schema.columns)} columns")

        ai_service = AIService()
        charts = []
        global_summary = None

        # Step 1: Get AI chart suggestions (if enabled)
        if ai_service.enabled:
            try:
                logger.info(f"AI enabled - getting chart suggestions (user_intent: {user_intent})")
                chart_suggestions = ai_service.suggest_charts(schema, user_intent)
                logger.info(f"Received {len(chart_suggestions)} chart suggestions from AI")

                if chart_suggestions:
                    # Generate charts based on AI suggestions
                    logger.info("Generating charts from AI suggestions using ChartGenerator")
                    chart_generator = ChartGenerator()
                    charts_data = chart_generator.generate_charts_from_suggestions(
                        df, schema, chart_suggestions
                    )
                    charts = [ChartData(**chart) for chart in charts_data]
                    logger.info(f"Successfully generated {len(charts)} charts from AI suggestions")
                else:
                    logger.warning("No AI chart suggestions returned, falling back to heuristics")
                    # Fallback to heuristics if AI returns empty
                    chart_generator = ChartGenerator()
                    charts_data = chart_generator.generate_charts(df, schema, max_charts=4)
                    charts = [ChartData(**chart) for chart in charts_data]
                    logger.info(f"Generated {len(charts)} charts using heuristics")

            except Exception as e:
                logger.warning(
                    f"AI chart suggestions failed: {e}, falling back to heuristics", exc_info=True
                )
                # Fallback to heuristics if AI fails
                chart_generator = ChartGenerator()
                charts_data = chart_generator.generate_charts(df, schema, max_charts=4)
                charts = [ChartData(**chart) for chart in charts_data]
                logger.info(f"Generated {len(charts)} charts using heuristics (fallback)")
        else:
            # No AI available, use heuristics
            logger.info("AI not enabled, using heuristic-based chart generation")
            chart_generator = ChartGenerator()
            charts_data = chart_generator.generate_charts(df, schema, max_charts=4)
            charts = [ChartData(**chart) for chart in charts_data]
            logger.info(f"Generated {len(charts)} charts using heuristics")

        # Step 2: Generate AI insights for each chart (if enabled)
        if ai_service.enabled and charts:
            try:
                logger.info(f"Generating AI insights for {len(charts)} charts")
                # Generate insight for each chart by creating new chart objects
                charts_with_insights = []
                for idx, chart in enumerate(charts):
                    insight = ai_service.generate_chart_insight(chart, schema)
                    # Create new chart with insight
                    chart_dict = chart.model_dump()
                    chart_dict["insight"] = insight
                    charts_with_insights.append(ChartData(**chart_dict))
                    logger.debug(
                        f"Generated insight for chart {idx + 1}/{len(charts)}: {chart.title}"
                    )

                # Replace charts with versions that have insights
                charts = charts_with_insights

                # Generate global summary
                logger.info("Generating global summary")
                global_summary = ai_service.generate_global_summary(charts, schema)
                logger.info("Successfully generated global summary")

            except Exception as e:
                logger.warning(f"AI insights generation failed: {e}", exc_info=True)
                # Continue without insights (graceful degradation)

        logger.info(f"Analysis complete: {len(charts)} charts generated")
        return AnalyzeResponse(
            upload_id=upload_id,
            filename=filename,
            data_schema=schema,
            charts=charts,
            upload_timestamp=upload_data["timestamp"],
            global_summary=global_summary,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing file: {str(e)}")
