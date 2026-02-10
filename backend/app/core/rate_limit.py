"""
Rate limiting configuration using slowapi.

Provides a limiter instance with user-aware key extraction.
Authenticated users are identified by user ID; anonymous by IP.
"""
import logging

from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

logger = logging.getLogger(__name__)


def _get_key(request: Request) -> str:
    """Use user ID if authenticated, otherwise IP address."""
    user = getattr(request.state, "user", None)
    if user and hasattr(user, "id"):
        return f"user:{user.id}"
    return get_remote_address(request)


limiter = Limiter(key_func=_get_key)
