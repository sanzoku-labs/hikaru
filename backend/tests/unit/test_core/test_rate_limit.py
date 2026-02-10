"""Tests for rate limiting module."""
from unittest.mock import MagicMock

from app.core.rate_limit import _get_key, limiter


class TestRateLimit:
    """Tests for rate limit key function and limiter."""

    def test_key_returns_ip_for_unauthenticated(self) -> None:
        """Key function returns IP address when no user is set."""
        request = MagicMock()
        request.state = MagicMock(spec=[])  # No user attribute
        request.client = MagicMock()
        request.client.host = "192.168.1.100"

        key = _get_key(request)
        assert key == "192.168.1.100"

    def test_key_returns_user_id_for_authenticated(self) -> None:
        """Key function returns user:<id> when user is authenticated."""
        request = MagicMock()
        user = MagicMock()
        user.id = 42
        request.state.user = user

        key = _get_key(request)
        assert key == "user:42"

    def test_limiter_instance_exists(self) -> None:
        """Limiter is properly instantiated."""
        assert limiter is not None

    def test_key_handles_missing_user_attribute(self) -> None:
        """Key function handles state with user=None gracefully."""
        request = MagicMock()
        request.state.user = None
        request.client = MagicMock()
        request.client.host = "10.0.0.1"

        key = _get_key(request)
        assert key == "10.0.0.1"

    def test_key_handles_user_without_id(self) -> None:
        """Key function falls back to IP when user has no id attribute."""
        request = MagicMock()
        user = MagicMock(spec=[])  # No id attribute
        request.state.user = user
        request.client = MagicMock()
        request.client.host = "172.16.0.1"

        key = _get_key(request)
        assert key == "172.16.0.1"
