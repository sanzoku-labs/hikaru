"""Analysis service - centralized chart generation and AI insights logic."""

import logging
from typing import Any, Dict, List, Optional

import pandas as pd

from app.models.schemas import ChartData, DataSchema
from app.services.ai_service import AIService
from app.services.chart_generator import ChartGenerator

logger = logging.getLogger(__name__)


class AnalysisService:
    """Service for performing data analysis with chart generation and AI insights."""

    def __init__(
        self,
        chart_generator: Optional[ChartGenerator] = None,
        ai_service: Optional[AIService] = None,
    ):
        """
        Initialize AnalysisService.

        Args:
            chart_generator: ChartGenerator instance (creates default if not provided)
            ai_service: AIService instance (creates default if not provided)
        """
        self.chart_generator = chart_generator or ChartGenerator()
        self.ai_service = ai_service or AIService()

    def generate_charts(
        self,
        df: pd.DataFrame,
        schema: DataSchema,
        user_intent: Optional[str] = None,
        max_charts: int = 4,
    ) -> List[ChartData]:
        """
        Generate charts using AI suggestions or heuristics fallback.

        Args:
            df: DataFrame to analyze
            schema: Data schema
            user_intent: Optional user intent for AI suggestions
            max_charts: Maximum number of charts to generate (default: 4)

        Returns:
            List of ChartData objects
        """
        charts = []

        # Try AI-based chart suggestions first
        if self.ai_service.enabled:
            try:
                logger.info(f"AI enabled - getting chart suggestions (user_intent: {user_intent})")
                chart_suggestions = self.ai_service.suggest_charts(schema, user_intent)
                logger.info(f"Received {len(chart_suggestions)} chart suggestions from AI")

                if chart_suggestions:
                    # Generate charts based on AI suggestions
                    logger.info("Generating charts from AI suggestions using ChartGenerator")
                    charts_data = self.chart_generator.generate_charts_from_suggestions(
                        df, schema, chart_suggestions
                    )
                    charts = [ChartData(**chart) for chart in charts_data]
                    logger.info(f"Successfully generated {len(charts)} charts from AI suggestions")
                    return charts
                else:
                    logger.warning("No AI chart suggestions returned, falling back to heuristics")

            except Exception as e:
                logger.warning(
                    f"AI chart suggestions failed: {e}, falling back to heuristics", exc_info=True
                )

        # Fallback to heuristics (or when AI is disabled)
        if not self.ai_service.enabled:
            logger.info("AI not enabled, using heuristic-based chart generation")

        charts_data = self.chart_generator.generate_charts(df, schema, max_charts=max_charts)
        charts = [ChartData(**chart) for chart in charts_data]
        logger.info(f"Generated {len(charts)} charts using heuristics")

        return charts

    def add_insights_to_charts(
        self, charts: List[ChartData], schema: DataSchema
    ) -> List[ChartData]:
        """
        Add AI insights to charts.

        Args:
            charts: List of ChartData objects
            schema: Data schema

        Returns:
            List of ChartData objects with insights added
        """
        if not self.ai_service.enabled or not charts:
            return charts

        charts_with_insights = []

        try:
            logger.info(f"Generating AI insights for {len(charts)} charts")

            for idx, chart in enumerate(charts):
                try:
                    # Generate insight for this chart
                    insight = self.ai_service.generate_chart_insight(chart, schema)

                    # Create new chart with insight
                    chart_dict = chart.model_dump()
                    chart_dict["insight"] = insight
                    charts_with_insights.append(ChartData(**chart_dict))

                    logger.debug(
                        f"Generated insight for chart {idx + 1}/{len(charts)}: {chart.title}"
                    )

                except Exception as e:
                    logger.warning(
                        f"Failed to generate insight for chart '{chart.title}': {e}", exc_info=True
                    )
                    # Add chart without insight (graceful degradation)
                    charts_with_insights.append(chart)

            return charts_with_insights

        except Exception as e:
            logger.warning(f"AI insights generation failed: {e}", exc_info=True)
            # Return original charts without insights
            return charts

    def generate_global_summary(
        self,
        charts: List[ChartData],
        schema: DataSchema,
        user_intent: Optional[str] = None,
    ) -> Optional[str]:
        """
        Generate global summary for the dataset.

        Args:
            charts: List of ChartData objects
            schema: Data schema
            user_intent: Optional user intent

        Returns:
            Global summary string, or None if AI is disabled or fails
        """
        if not self.ai_service.enabled:
            return None

        try:
            logger.info("Generating global summary")
            summary = self.ai_service.generate_global_summary(charts, schema)
            logger.info("Successfully generated global summary")
            return summary

        except Exception as e:
            logger.warning(f"Global summary generation failed: {e}", exc_info=True)
            # Graceful degradation - return None
            return None

    def perform_full_analysis(
        self,
        df: pd.DataFrame,
        schema: DataSchema,
        user_intent: Optional[str] = None,
        max_charts: int = 4,
        include_chart_insights: bool = False,
    ) -> Dict[str, Any]:
        """
        Perform complete analysis: generate charts, optionally add insights,
        and create global summary.

        Args:
            df: DataFrame to analyze
            schema: Data schema
            user_intent: Optional user intent
            max_charts: Maximum number of charts to generate
            include_chart_insights: Whether to generate per-chart AI insights (default: False).
                                   Set to False for faster initial analysis - insights can be
                                   requested on-demand via /api/charts/insight endpoint.

        Returns:
            Dictionary with 'charts' and 'global_summary' keys
        """
        logger.info(
            f"Starting full analysis (user_intent: {user_intent}, max_charts: {max_charts}, "
            f"include_chart_insights: {include_chart_insights})"
        )

        # Step 1: Generate charts
        charts = self.generate_charts(df, schema, user_intent, max_charts)
        logger.info(f"Generated {len(charts)} charts")

        # Step 2: Optionally add insights to charts (skipped by default for faster response)
        if include_chart_insights:
            charts = self.add_insights_to_charts(charts, schema)
            logger.info(f"Added insights to {len(charts)} charts")
        else:
            logger.info("Skipping per-chart insights (available on-demand)")

        # Step 3: Generate global summary
        global_summary = self.generate_global_summary(charts, schema, user_intent)

        if global_summary:
            logger.info("Full analysis complete with global summary")
        else:
            logger.info("Full analysis complete (no global summary)")

        return {
            "charts": charts,
            "global_summary": global_summary,
        }
