"""
Authentication API endpoints for user registration, login, and user management.
"""
import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.rate_limit import limiter
from app.database import get_db
from app.middleware.auth import get_current_active_user, get_current_user
from app.models.database import User
from app.models.schemas import TokenResponse, UserLogin, UserResponse
from app.services import auth_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["authentication"])


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(request: Request, credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Login with username/email and password.

    Authenticates user and returns a JWT access token.

    Args:
        credentials: Login credentials (username/email and password)
        request: FastAPI request object (for IP and user agent)
        db: Database session

    Returns:
        TokenResponse with access_token and user information

    Raises:
        HTTP 401: If credentials are invalid
    """
    # Authenticate user
    user = auth_service.authenticate_user(
        db=db, username=credentials.username, password=credentials.password
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Generate JWT token
    access_token = auth_service.create_access_token(data={"sub": str(user.id)})

    # Decode token to get expiration and JTI
    payload = auth_service.decode_access_token(access_token)
    expires_at = datetime.utcfromtimestamp(payload["exp"])
    token_jti = payload["jti"]

    # Create session record
    auth_service.create_session(
        db=db,
        user_id=user.id,
        token_jti=token_jti,
        expires_at=expires_at,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return TokenResponse(
        access_token=access_token, token_type="bearer", user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_active_user)):
    """
    Get current authenticated user's information.

    Requires valid JWT token in Authorization header.

    Args:
        current_user: Current authenticated user (from JWT token)

    Returns:
        UserResponse with user information
    """
    return UserResponse.model_validate(current_user)


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(
    current_user: User = Depends(get_current_user),
    request: Request = None,
    db: Session = Depends(get_db),
):
    """
    Logout current user by revoking the JWT token.

    Requires valid JWT token in Authorization header.

    Args:
        current_user: Current authenticated user
        request: FastAPI request object
        db: Database session

    Returns:
        Success message
    """
    # Extract token from Authorization header
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authorization header"
        )

    token = auth_header.replace("Bearer ", "")
    payload = auth_service.decode_access_token(token)

    if not payload or "jti" not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    # Revoke session
    auth_service.revoke_session(db, payload["jti"])

    return {"message": "Successfully logged out"}


@router.get("/health")
async def health_check():
    """Health check endpoint for authentication service."""
    return {"status": "healthy", "service": "authentication", "version": "1.0.0"}
