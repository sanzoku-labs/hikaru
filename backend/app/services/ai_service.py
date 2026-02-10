"""
AI Service - Facade for AI-powered features.

This service acts as a facade/coordinator for specialized AI services:
- AIInsightService: Chart insights and summaries
- AIConversationService: Q&A interactions
- AIAnalysisService: Chart suggestions and comparisons

Refactored in Phase 4.1 to follow Single Responsibility Principle.
Maintains backward compatibility with existing routes.
"""

import logging
from typing import Any, Dict, List, Optional

from app.config import settings
from app.models.schemas import ChartData, DataSchema
from app.services.ai_analysis_service import AIAnalysisService
from app.services.ai_conversation_service import AIConversationService
from app.services.ai_insight_service import AIInsightService
from app.services.cache_service import CacheService

logger = logging.getLogger(__name__)


class AIService:
    """
    Facade service for AI-powered features.

    Delegates to specialized services:
    - AIInsightService for chart insights and summaries
    - AIConversationService for Q&A
    - AIAnalysisService for chart suggestions and comparisons
    """

    def __init__(self, cache_service: Optional[CacheService] = None) -> None:
        """
        Initialize AIService with specialized sub-services.

        Args:
            cache_service: Optional CacheService for caching insights
        """
        self.enabled = bool(settings.anthropic_api_key)

        if not self.enabled:
            logger.warning("ANTHROPIC_API_KEY not set. AI features will be disabled.")

        # Initialize specialized services
        self.insight_service = AIInsightService(cache_service=cache_service)
        self.conversation_service = AIConversationService()
        self.analysis_service = AIAnalysisService()

        # For backward compatibility
        self.cache = cache_service

    # ===== Chart Insights (delegates to AIInsightService) =====

    def generate_chart_insight(self, chart: ChartData, schema: DataSchema) -> Optional[str]:
        """
        Generate insight for a single chart.

        Delegates to AIInsightService.
        """
        return self.insight_service.generate_chart_insight(chart, schema)

    def generate_global_summary(self, charts: List[ChartData], schema: DataSchema) -> Optional[str]:
        """
        Generate overall summary of the dataset.

        Delegates to AIInsightService.
        """
        return self.insight_service.generate_global_summary(charts, schema)

    # ===== Q&A Conversation (delegates to AIConversationService) =====

    def generate_query_response(
        self,
        upload_id: str,
        question: str,
        schema: DataSchema,
        conversation_id: Optional[str] = None,
    ) -> tuple[str, str, Optional[Dict[str, Any]]]:
        """
        Generate response to user's natural language question.

        Delegates to AIConversationService.

        Returns:
            Tuple of (answer, conversation_id, chart_config)
        """
        return self.conversation_service.generate_query_response(
            upload_id, question, schema, conversation_id
        )

    # ===== Chart Suggestions (delegates to AIAnalysisService) =====

    def suggest_charts(
        self, schema: DataSchema, user_intent: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Use AI to suggest 3-4 meaningful charts.

        Delegates to AIAnalysisService.
        """
        return self.analysis_service.suggest_charts(schema, user_intent)

    # ===== File Comparison (delegates to AIAnalysisService) =====

    async def generate_comparison_insight(
        self, file_a_name: str, file_b_name: str, metrics: Dict[str, Any], comparison_type: str
    ) -> str:
        """
        Generate AI insight comparing two files.

        Delegates to AIAnalysisService.
        """
        return await self.analysis_service.generate_comparison_insight(
            file_a_name, file_b_name, metrics, comparison_type
        )

    async def generate_chart_comparison_insight(
        self, chart: Any, metrics: Dict[str, Any]
    ) -> Optional[str]:
        """
        Generate insight for a specific comparison chart.

        Delegates to AIAnalysisService.
        """
        return await self.analysis_service.generate_chart_comparison_insight(chart, metrics)

    # ===== Utility Methods =====

    @staticmethod
    def clear_conversations() -> None:
        """Clear all conversations (useful for testing)"""
        AIConversationService.clear_conversations()

    @staticmethod
    def clear_cache() -> None:
        """Clear the insight cache (useful for testing)"""
        # This is a no-op now since cache is managed by CacheService
        # Kept for backward compatibility
        logger.debug("clear_cache called - cache is now managed by CacheService")
