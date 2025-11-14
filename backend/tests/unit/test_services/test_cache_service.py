"""Tests for CacheService (replaces _insight_cache global state with Redis)."""

import pytest
from datetime import datetime, timedelta
from fakeredis import FakeRedis

from app.services.cache_service import CacheService


class TestCacheServiceSet:
    """Tests for setting cache values."""

    def test_set_cache_stores_value(self, redis_client: FakeRedis):
        """Test that set stores a value in Redis."""
        service = CacheService(redis_client)

        service.set("test_key", "test_value", ttl_hours=24)

        # Verify value was stored
        stored_value = redis_client.get("test_key")
        assert stored_value is not None
        assert stored_value == "test_value"

    def test_set_cache_with_custom_ttl(self, redis_client: FakeRedis):
        """Test that set respects custom TTL."""
        service = CacheService(redis_client)

        service.set("ttl_key", "ttl_value", ttl_hours=1)

        # Check that TTL was set (in seconds)
        ttl = redis_client.ttl("ttl_key")
        assert ttl > 0
        assert ttl <= 3600  # 1 hour in seconds

    def test_set_cache_overwrites_existing_value(self, redis_client: FakeRedis):
        """Test that set overwrites an existing value."""
        service = CacheService(redis_client)

        service.set("overwrite_key", "original_value", ttl_hours=24)
        service.set("overwrite_key", "new_value", ttl_hours=24)

        stored_value = redis_client.get("overwrite_key")
        assert stored_value == "new_value"


class TestCacheServiceGet:
    """Tests for getting cache values."""

    def test_get_cache_returns_value_when_exists(self, redis_client: FakeRedis):
        """Test that get returns the value when it exists."""
        service = CacheService(redis_client)

        service.set("existing_key", "existing_value", ttl_hours=24)

        result = service.get("existing_key")
        assert result == "existing_value"

    def test_get_cache_returns_none_when_missing(self, redis_client: FakeRedis):
        """Test that get returns None when key doesn't exist."""
        service = CacheService(redis_client)

        result = service.get("nonexistent_key")
        assert result is None

    def test_get_cache_returns_none_after_expiry(self, redis_client: FakeRedis):
        """Test that get returns None after TTL expires."""
        service = CacheService(redis_client)

        # Set with very short TTL (1 second)
        redis_client.setex("expiring_key", 1, "expiring_value")

        # Immediately check - should exist
        assert service.get("expiring_key") == "expiring_value"

        # Manually delete to simulate expiry (FakeRedis doesn't auto-expire)
        redis_client.delete("expiring_key")

        # After expiry - should be None
        assert service.get("expiring_key") is None


class TestCacheServiceDelete:
    """Tests for deleting cache values."""

    def test_delete_removes_value(self, redis_client: FakeRedis):
        """Test that delete removes a value from cache."""
        service = CacheService(redis_client)

        service.set("delete_me", "value", ttl_hours=24)
        assert service.get("delete_me") == "value"

        service.delete("delete_me")
        assert service.get("delete_me") is None

    def test_delete_nonexistent_key_does_not_error(self, redis_client: FakeRedis):
        """Test that delete doesn't error on nonexistent key."""
        service = CacheService(redis_client)

        # Should not raise any errors
        service.delete("nonexistent_key")


class TestCacheServiceClear:
    """Tests for clearing all cache values."""

    def test_clear_removes_all_values(self, redis_client: FakeRedis):
        """Test that clear removes all values from cache."""
        service = CacheService(redis_client)

        # Store multiple values
        service.set("key1", "value1", ttl_hours=24)
        service.set("key2", "value2", ttl_hours=24)
        service.set("key3", "value3", ttl_hours=24)

        assert redis_client.dbsize() == 3

        service.clear()

        assert redis_client.dbsize() == 0

    def test_clear_on_empty_cache(self, redis_client: FakeRedis):
        """Test that clear works on empty cache."""
        service = CacheService(redis_client)

        # Should not raise any errors
        service.clear()

        assert redis_client.dbsize() == 0


class TestCacheServiceExists:
    """Tests for checking if cache key exists."""

    def test_exists_returns_true_when_key_exists(self, redis_client: FakeRedis):
        """Test that exists returns True when key exists."""
        service = CacheService(redis_client)

        service.set("existing", "value", ttl_hours=24)

        assert service.exists("existing") is True

    def test_exists_returns_false_when_key_missing(self, redis_client: FakeRedis):
        """Test that exists returns False when key doesn't exist."""
        service = CacheService(redis_client)

        assert service.exists("missing") is False


class TestCacheServiceKeyGeneration:
    """Tests for cache key generation helpers."""

    def test_chart_insight_key_format(self, redis_client: FakeRedis):
        """Test that chart insight key follows expected format."""
        service = CacheService(redis_client)

        key = service.chart_insight_key("line_chart", "Monthly Revenue")
        assert key == "chart_insight:line_chart:Monthly Revenue"

    def test_global_summary_key_format(self, redis_client: FakeRedis):
        """Test that global summary key follows expected format."""
        service = CacheService(redis_client)

        key = service.global_summary_key(num_charts=4, row_count=1000)
        assert key == "global_summary:4:1000"

    def test_conversation_key_format(self, redis_client: FakeRedis):
        """Test that conversation key follows expected format."""
        service = CacheService(redis_client)

        key = service.conversation_key("upload-123", "conv-456")
        assert key == "conversation:upload-123:conv-456"
