"""
Authentication middleware for JWT token validation.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.services import auth_service
from app.models.database import User

# HTTP Bearer token scheme
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to get the current authenticated user from JWT token.

    Usage:
        @app.get("/protected")
        def protected_endpoint(current_user: User = Depends(get_current_user)):
            return {"message": f"Hello {current_user.username}"}

    Args:
        credentials: HTTP Authorization header with Bearer token
        db: Database session

    Returns:
        User object if authentication successful

    Raises:
        HTTPException: 401 if token is invalid, expired, or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Extract token from Authorization header
    token = credentials.credentials

    # Decode token
    payload = auth_service.decode_access_token(token)
    if payload is None:
        raise credentials_exception

    # Get user_id from token
    user_id: Optional[int] = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    # Get jti (token ID) from token
    token_jti: Optional[str] = payload.get("jti")
    if token_jti is None:
        raise credentials_exception

    # Check if session is revoked
    if auth_service.is_session_revoked(db, token_jti):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Get user from database
    user = auth_service.get_user_by_id(db, int(user_id))
    if user is None:
        raise credentials_exception

    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to get the current authenticated and active user.

    This is a convenience function that combines get_current_user
    with an additional active status check.

    Args:
        current_user: User from get_current_user dependency

    Returns:
        User object if user is active

    Raises:
        HTTPException: 403 if user is not active
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )
    return current_user


async def get_current_superuser(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to get the current authenticated superuser.

    Use this for admin-only endpoints.

    Args:
        current_user: User from get_current_user dependency

    Returns:
        User object if user is a superuser

    Raises:
        HTTPException: 403 if user is not a superuser
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions. Superuser access required."
        )
    return current_user


def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Dependency to optionally get the current user if a token is provided.

    This doesn't raise an error if no token is provided, making it useful
    for endpoints that can work both with and without authentication.

    Args:
        credentials: Optional HTTP Authorization header
        db: Database session

    Returns:
        User object if token is valid, None if no token or invalid token
    """
    if credentials is None:
        return None

    try:
        token = credentials.credentials
        payload = auth_service.decode_access_token(token)
        if payload is None:
            return None

        user_id: Optional[int] = payload.get("sub")
        if user_id is None:
            return None

        token_jti: Optional[str] = payload.get("jti")
        if token_jti and auth_service.is_session_revoked(db, token_jti):
            return None

        user = auth_service.get_user_by_id(db, int(user_id))
        if user and user.is_active:
            return user

    except Exception:
        return None

    return None
