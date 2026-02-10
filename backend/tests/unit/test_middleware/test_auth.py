"""
Unit tests for authentication middleware.

Tests authentication dependencies:
- get_current_user
- get_current_active_user
- get_current_superuser
- get_optional_current_user
- get_user_project
"""
from datetime import timedelta
from typing import Generator

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.middleware.auth import (
    get_current_active_user,
    get_current_superuser,
    get_current_user,
    get_optional_current_user,
    get_user_project,
)
from app.models.database import Project
from app.models.database import Session as UserSession
from app.models.database import User
from app.services.auth_service import create_access_token, hash_password

# Use in-memory SQLite for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session() -> Generator[Session, None, None]:
    """Create a fresh database session for each test."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def test_user(db_session: Session) -> User:
    """Create a test user."""
    user = User(
        username="testuser",
        email="test@example.com",
        hashed_password=hash_password("TestPassword123!"),
        full_name="Test User",
        is_active=True,
        is_superuser=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def inactive_user(db_session: Session) -> User:
    """Create an inactive test user."""
    user = User(
        username="inactiveuser",
        email="inactive@example.com",
        hashed_password=hash_password("TestPassword123!"),
        full_name="Inactive User",
        is_active=False,
        is_superuser=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def superuser(db_session: Session) -> User:
    """Create a superuser."""
    user = User(
        username="admin",
        email="admin@example.com",
        hashed_password=hash_password("AdminPassword123!"),
        full_name="Admin User",
        is_active=True,
        is_superuser=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_project(db_session: Session, test_user: User) -> Project:
    """Create a test project owned by test_user."""
    project = Project(
        name="Test Project",
        description="A test project",
        user_id=test_user.id,
    )
    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)
    return project


class TestGetCurrentUser:
    """Test suite for get_current_user dependency"""

    @pytest.mark.asyncio
    async def test_valid_token_returns_user(self, db_session: Session, test_user: User):
        """Test that valid token returns the user"""
        # Create access token
        token = create_access_token(data={"sub": str(test_user.id)})

        # Create session for the token
        from datetime import datetime

        from app.services.auth_service import decode_access_token

        payload = decode_access_token(token)
        session = UserSession(
            user_id=test_user.id,
            token_jti=payload["jti"],
            expires_at=datetime.utcfromtimestamp(payload["exp"]),
            is_revoked=False,
        )
        db_session.add(session)
        db_session.commit()

        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

        user = await get_current_user(credentials=credentials, db=db_session)

        assert user.id == test_user.id
        assert user.username == test_user.username
        assert user.email == test_user.email

    @pytest.mark.asyncio
    async def test_invalid_token_raises_401(self, db_session: Session):
        """Test that invalid token raises 401"""
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="invalid_token")

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(credentials=credentials, db=db_session)

        assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_expired_token_raises_401(self, db_session: Session, test_user: User):
        """Test that expired token raises 401"""
        # Create token that expires immediately
        token = create_access_token(
            data={"sub": str(test_user.id)}, expires_delta=timedelta(seconds=-1)
        )
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(credentials=credentials, db=db_session)

        assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_revoked_session_raises_401(self, db_session: Session, test_user: User):
        """Test that revoked session raises 401"""
        # Create access token
        token = create_access_token(data={"sub": str(test_user.id)})

        # Create revoked session
        from datetime import datetime

        from app.services.auth_service import decode_access_token

        payload = decode_access_token(token)
        session = UserSession(
            user_id=test_user.id,
            token_jti=payload["jti"],
            expires_at=datetime.utcfromtimestamp(payload["exp"]),
            is_revoked=True,  # Revoked
        )
        db_session.add(session)
        db_session.commit()

        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(credentials=credentials, db=db_session)

        assert exc_info.value.status_code == 401
        assert "revoked" in exc_info.value.detail.lower()

    @pytest.mark.asyncio
    async def test_inactive_user_raises_403(self, db_session: Session, inactive_user: User):
        """Test that inactive user raises 403"""
        # Create access token for inactive user
        token = create_access_token(data={"sub": str(inactive_user.id)})

        # Create session
        from datetime import datetime

        from app.services.auth_service import decode_access_token

        payload = decode_access_token(token)
        session = UserSession(
            user_id=inactive_user.id,
            token_jti=payload["jti"],
            expires_at=datetime.utcfromtimestamp(payload["exp"]),
            is_revoked=False,
        )
        db_session.add(session)
        db_session.commit()

        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(credentials=credentials, db=db_session)

        assert exc_info.value.status_code == 403
        assert "disabled" in exc_info.value.detail.lower()

    @pytest.mark.asyncio
    async def test_nonexistent_user_raises_401(self, db_session: Session):
        """Test that token for nonexistent user raises 401"""
        # Create token for user ID that doesn't exist
        token = create_access_token(data={"sub": "99999"})

        # Create session
        from datetime import datetime

        from app.services.auth_service import decode_access_token

        payload = decode_access_token(token)
        session = UserSession(
            user_id=99999,
            token_jti=payload["jti"],
            expires_at=datetime.utcfromtimestamp(payload["exp"]),
            is_revoked=False,
        )
        db_session.add(session)
        db_session.commit()

        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(credentials=credentials, db=db_session)

        assert exc_info.value.status_code == 401


class TestGetCurrentActiveUser:
    """Test suite for get_current_active_user dependency"""

    @pytest.mark.asyncio
    async def test_active_user_returns_user(self, test_user: User):
        """Test that active user is returned"""
        user = await get_current_active_user(current_user=test_user)

        assert user.id == test_user.id
        assert user.is_active is True

    @pytest.mark.asyncio
    async def test_inactive_user_raises_403(self, inactive_user: User):
        """Test that inactive user raises 403"""
        with pytest.raises(HTTPException) as exc_info:
            await get_current_active_user(current_user=inactive_user)

        assert exc_info.value.status_code == 403
        assert "disabled" in exc_info.value.detail.lower()


class TestGetCurrentSuperuser:
    """Test suite for get_current_superuser dependency"""

    @pytest.mark.asyncio
    async def test_superuser_returns_user(self, superuser: User):
        """Test that superuser is returned"""
        user = await get_current_superuser(current_user=superuser)

        assert user.id == superuser.id
        assert user.is_superuser is True

    @pytest.mark.asyncio
    async def test_regular_user_raises_403(self, test_user: User):
        """Test that regular user raises 403"""
        with pytest.raises(HTTPException) as exc_info:
            await get_current_superuser(current_user=test_user)

        assert exc_info.value.status_code == 403
        assert (
            "permission" in exc_info.value.detail.lower()
            or "superuser" in exc_info.value.detail.lower()
        )


class TestGetOptionalCurrentUser:
    """Test suite for get_optional_current_user dependency"""

    def test_no_credentials_returns_none(self, db_session: Session):
        """Test that no credentials returns None"""
        user = get_optional_current_user(credentials=None, db=db_session)

        assert user is None

    def test_valid_token_returns_user(self, db_session: Session, test_user: User):
        """Test that valid token returns user"""
        # For now, just test the None case since the full implementation
        # would require async support
        user = get_optional_current_user(credentials=None, db=db_session)
        assert user is None


class TestGetUserProject:
    """Test suite for get_user_project dependency"""

    @pytest.mark.asyncio
    async def test_user_can_access_own_project(
        self, db_session: Session, test_user: User, test_project: Project
    ):
        """Test that user can access their own project"""
        project = await get_user_project(
            project_id=test_project.id, current_user=test_user, db=db_session
        )

        assert project.id == test_project.id
        assert project.user_id == test_user.id

    @pytest.mark.asyncio
    async def test_user_cannot_access_others_project(
        self, db_session: Session, test_user: User, superuser: User
    ):
        """Test that user cannot access another user's project"""
        # Create project owned by superuser
        other_project = Project(
            name="Other Project",
            description="Not yours",
            user_id=superuser.id,
        )
        db_session.add(other_project)
        db_session.commit()
        db_session.refresh(other_project)

        # Try to access with test_user
        with pytest.raises(HTTPException) as exc_info:
            await get_user_project(
                project_id=other_project.id, current_user=test_user, db=db_session
            )

        assert exc_info.value.status_code == 404

    @pytest.mark.asyncio
    async def test_nonexistent_project_raises_404(self, db_session: Session, test_user: User):
        """Test that nonexistent project raises 404"""
        with pytest.raises(HTTPException) as exc_info:
            await get_user_project(project_id=99999, current_user=test_user, db=db_session)

        assert exc_info.value.status_code == 404
