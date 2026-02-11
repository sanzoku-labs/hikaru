"""Cache service - replaces global _insight_cache with Redis."""

import logging
from typing import Optional

from redis import Redis

logger = logging.getLogger(__name__)


class CacheService:
    """Service for managing cache operations with Redis."""

    def __init__(self, redis_client: Redis):
        """
        Initialize the cache service with a Redis client.

        Args:
            redis_client: Redis client instance
        """
        self.redis = redis_client

    def set(self, key: str, value: str, ttl_hours: int = 24) -> None:
        """
        Store a value in cache with TTL.

        Args:
            key: Cache key
            value: Value to store
            ttl_hours: Time-to-live in hours (default: 24)
        """
        ttl_seconds = ttl_hours * 3600
        self.redis.setex(key, ttl_seconds, value)
        logger.debug(f"Cached value for key: {key} with TTL: {ttl_hours}h")

    def get(self, key: str) -> Optional[str]:
        """
        Retrieve a value from cache.

        Args:
            key: Cache key

        Returns:
            The cached value, or None if not found or expired
        """
        value = self.redis.get(key)
        if value:
            logger.debug(f"Cache hit for key: {key}")
            return str(value) if not isinstance(value, str) else value
        else:
            logger.debug(f"Cache miss for key: {key}")
            return None

    def delete(self, key: str) -> None:
        """
        Delete a value from cache.

        Args:
            key: Cache key to delete
        """
        self.redis.delete(key)
        logger.debug(f"Deleted cache key: {key}")

    def clear(self) -> None:
        """Clear all values from cache."""
        self.redis.flushdb()
        logger.info("Cleared all cache")

    def exists(self, key: str) -> bool:
        """
        Check if a key exists in cache.

        Args:
            key: Cache key to check

        Returns:
            True if key exists, False otherwise
        """
        return bool(self.redis.exists(key))

    # Helper methods for generating cache keys

    def chart_insight_key(self, chart_type: str, chart_title: str) -> str:
        """
        Generate cache key for chart insights.

        Args:
            chart_type: Type of chart (e.g., 'line_chart', 'bar_chart')
            chart_title: Title of the chart

        Returns:
            Cache key string
        """
        return f"chart_insight:{chart_type}:{chart_title}"

    def global_summary_key(self, num_charts: int, row_count: int) -> str:
        """
        Generate cache key for global summaries.

        Args:
            num_charts: Number of charts in the analysis
            row_count: Number of rows in the dataset

        Returns:
            Cache key string
        """
        return f"global_summary:{num_charts}:{row_count}"

    def conversation_key(self, upload_id: str, conversation_id: str) -> str:
        """
        Generate cache key for conversations.

        Args:
            upload_id: Upload identifier
            conversation_id: Conversation identifier

        Returns:
            Cache key string
        """
        return f"conversation:{upload_id}:{conversation_id}"
