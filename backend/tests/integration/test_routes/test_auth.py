"""
Integration tests for /api/auth endpoints.

Tests the complete flow of authentication:
- User registration
- User login
- Get current user info
- Logout
- Health check
"""
import io
from typing import Generator

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models.database import Session as UserSession, User
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


@pytest.fixture(scope="function")
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """Create a test client with database override."""

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


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
def auth_headers(test_user: User) -> dict:
    """Create authorization headers with bearer token."""
    token = create_access_token(data={"sub": str(test_user.id)})
    return {"Authorization": f"Bearer {token}"}


class TestRegisterEndpoint:
    """Test suite for /api/auth/register endpoint"""

    def test_register_success(self, client: TestClient, db_session: Session):
        """Test successful user registration"""
        user_data = {
            "email": "newuser@example.com",
            "username": "newuser",
            "password": "SecurePassword123!",
            "full_name": "New User",
        }

        response = client.post("/api/auth/register", json=user_data)

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()

        # Verify response structure
        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"
        assert "user" in data

        # Verify user info
        user_info = data["user"]
        assert user_info["email"] == user_data["email"]
        assert user_info["username"] == user_data["username"]
        assert user_info["full_name"] == user_data["full_name"]
        assert "id" in user_info
        assert user_info["is_active"] is True

        # Verify password is not in response
        assert "password" not in user_info
        assert "hashed_password" not in user_info

        # Verify user was created in database
        from app.models.database import User

        user = db_session.query(User).filter_by(email=user_data["email"]).first()
        assert user is not None
        assert user.username == user_data["username"]

    def test_register_duplicate_email(self, client: TestClient, test_user: User):
        """Test registration with existing email returns 400"""
        user_data = {
            "email": test_user.email,  # Duplicate email
            "username": "differentusername",
            "password": "SecurePassword123!",
            "full_name": "Another User",
        }

        response = client.post("/api/auth/register", json=user_data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "detail" in response.json()

    def test_register_duplicate_username(self, client: TestClient, test_user: User):
        """Test registration with existing username returns 400"""
        user_data = {
            "email": "newemail@example.com",
            "username": test_user.username,  # Duplicate username
            "password": "SecurePassword123!",
            "full_name": "Another User",
        }

        response = client.post("/api/auth/register", json=user_data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "detail" in response.json()

    def test_register_invalid_email(self, client: TestClient):
        """Test registration with invalid email format returns 422"""
        user_data = {
            "email": "not-an-email",
            "username": "validusername",
            "password": "SecurePassword123!",
            "full_name": "Test User",
        }

        response = client.post("/api/auth/register", json=user_data)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_register_missing_required_fields(self, client: TestClient):
        """Test registration with missing required fields returns 422"""
        user_data = {
            "email": "test@example.com",
            # Missing username and password
        }

        response = client.post("/api/auth/register", json=user_data)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_register_creates_session(self, client: TestClient, db_session: Session):
        """Test that registration creates a session record"""
        user_data = {
            "email": "newuser@example.com",
            "username": "newuser",
            "password": "SecurePassword123!",
            "full_name": "New User",
        }

        response = client.post("/api/auth/register", json=user_data)
        assert response.status_code == status.HTTP_201_CREATED

        # Verify session was created
        user_session = db_session.query(UserSession).filter_by(
            user_id=response.json()["user"]["id"]
        ).first()

        assert user_session is not None
        assert user_session.is_revoked is False
        assert user_session.ip_address is not None

    def test_register_token_is_valid(self, client: TestClient):
        """Test that the returned token can be used for authenticated requests"""
        user_data = {
            "email": "newuser@example.com",
            "username": "newuser",
            "password": "SecurePassword123!",
            "full_name": "New User",
        }

        response = client.post("/api/auth/register", json=user_data)
        assert response.status_code == status.HTTP_201_CREATED

        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Use token to access protected endpoint
        me_response = client.get("/api/auth/me", headers=headers)
        assert me_response.status_code == status.HTTP_200_OK
        assert me_response.json()["email"] == user_data["email"]


class TestLoginEndpoint:
    """Test suite for /api/auth/login endpoint"""

    def test_login_success_with_username(self, client: TestClient, test_user: User):
        """Test successful login with username"""
        credentials = {"username": test_user.username, "password": "TestPassword123!"}

        response = client.post("/api/auth/login", json=credentials)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["username"] == test_user.username

    def test_login_success_with_email(self, client: TestClient, test_user: User):
        """Test successful login with email"""
        credentials = {"username": test_user.email, "password": "TestPassword123!"}

        response = client.post("/api/auth/login", json=credentials)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "access_token" in data
        assert data["user"]["email"] == test_user.email

    def test_login_invalid_username(self, client: TestClient):
        """Test login with non-existent username returns 401"""
        credentials = {"username": "nonexistentuser", "password": "anypassword"}

        response = client.post("/api/auth/login", json=credentials)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "detail" in response.json()

    def test_login_invalid_password(self, client: TestClient, test_user: User):
        """Test login with incorrect password returns 401"""
        credentials = {"username": test_user.username, "password": "wrongpassword"}

        response = client.post("/api/auth/login", json=credentials)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_inactive_user(self, client: TestClient, inactive_user: User):
        """Test login with inactive user returns 401"""
        credentials = {"username": inactive_user.username, "password": "TestPassword123!"}

        response = client.post("/api/auth/login", json=credentials)

        # Should fail because user is inactive
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_creates_session(self, client: TestClient, test_user: User, db_session: Session):
        """Test that login creates a session record"""
        credentials = {"username": test_user.username, "password": "TestPassword123!"}

        response = client.post("/api/auth/login", json=credentials)
        assert response.status_code == status.HTTP_200_OK

        # Verify session was created
        user_session = db_session.query(UserSession).filter_by(user_id=test_user.id).first()

        assert user_session is not None
        assert user_session.is_revoked is False

    def test_login_token_is_valid(self, client: TestClient, test_user: User):
        """Test that the returned token can be used for authenticated requests"""
        credentials = {"username": test_user.username, "password": "TestPassword123!"}

        response = client.post("/api/auth/login", json=credentials)
        assert response.status_code == status.HTTP_200_OK

        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Use token to access protected endpoint
        me_response = client.get("/api/auth/me", headers=headers)
        assert me_response.status_code == status.HTTP_200_OK
        assert me_response.json()["username"] == test_user.username

    def test_login_missing_credentials(self, client: TestClient):
        """Test login with missing credentials returns 422"""
        response = client.post("/api/auth/login", json={})

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_login_multiple_sessions(self, client: TestClient, test_user: User, db_session: Session):
        """Test that user can have multiple active sessions"""
        credentials = {"username": test_user.username, "password": "TestPassword123!"}

        # Login twice
        response1 = client.post("/api/auth/login", json=credentials)
        response2 = client.post("/api/auth/login", json=credentials)

        assert response1.status_code == status.HTTP_200_OK
        assert response2.status_code == status.HTTP_200_OK

        # Should have two different tokens
        token1 = response1.json()["access_token"]
        token2 = response2.json()["access_token"]
        assert token1 != token2

        # Both tokens should work
        headers1 = {"Authorization": f"Bearer {token1}"}
        headers2 = {"Authorization": f"Bearer {token2}"}

        me_response1 = client.get("/api/auth/me", headers=headers1)
        me_response2 = client.get("/api/auth/me", headers=headers2)

        assert me_response1.status_code == status.HTTP_200_OK
        assert me_response2.status_code == status.HTTP_200_OK


class TestGetMeEndpoint:
    """Test suite for /api/auth/me endpoint"""

    def test_get_me_success(self, client: TestClient, auth_headers: dict, test_user: User):
        """Test successful retrieval of current user info"""
        response = client.get("/api/auth/me", headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert data["id"] == test_user.id
        assert data["username"] == test_user.username
        assert data["email"] == test_user.email
        assert data["full_name"] == test_user.full_name
        assert data["is_active"] == test_user.is_active

    def test_get_me_without_token(self, client: TestClient):
        """Test get me without authentication returns 403"""
        response = client.get("/api/auth/me")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_get_me_invalid_token(self, client: TestClient):
        """Test get me with invalid token returns 401"""
        headers = {"Authorization": "Bearer invalid_token"}

        response = client.get("/api/auth/me", headers=headers)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_me_expired_token(self, client: TestClient, test_user: User):
        """Test get me with expired token returns 401"""
        from datetime import timedelta
        from app.services.auth_service import create_access_token

        # Create token that expires immediately
        token = create_access_token(
            data={"sub": str(test_user.id)}, expires_delta=timedelta(seconds=-1)
        )
        headers = {"Authorization": f"Bearer {token}"}

        response = client.get("/api/auth/me", headers=headers)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_me_malformed_auth_header(self, client: TestClient):
        """Test get me with malformed authorization header returns 403"""
        headers = {"Authorization": "InvalidFormat"}

        response = client.get("/api/auth/me", headers=headers)

        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestLogoutEndpoint:
    """Test suite for /api/auth/logout endpoint"""

    def test_logout_success(self, client: TestClient, auth_headers: dict, db_session: Session):
        """Test successful logout"""
        response = client.post("/api/auth/logout", headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        assert "message" in response.json()

    def test_logout_without_token(self, client: TestClient):
        """Test logout without authentication returns 403 or 401"""
        response = client.post("/api/auth/logout")

        # Could be 403 (no auth header) or 401 (invalid auth)
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

    def test_logout_invalid_token(self, client: TestClient):
        """Test logout with invalid token returns 401"""
        headers = {"Authorization": "Bearer invalid_token"}

        response = client.post("/api/auth/logout", headers=headers)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_logout_revokes_session(
        self, client: TestClient, test_user: User, db_session: Session
    ):
        """Test that logout revokes the session"""
        # Login to create session
        credentials = {"username": test_user.username, "password": "TestPassword123!"}
        login_response = client.post("/api/auth/login", json=credentials)
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Verify session exists and is active
        from app.services.auth_service import decode_access_token

        payload = decode_access_token(token)
        session_before = (
            db_session.query(UserSession).filter_by(token_jti=payload["jti"]).first()
        )
        assert session_before is not None
        assert session_before.is_revoked is False

        # Logout
        logout_response = client.post("/api/auth/logout", headers=headers)
        assert logout_response.status_code == status.HTTP_200_OK

        # Verify session is revoked
        db_session.expire_all()  # Clear cache
        session_after = (
            db_session.query(UserSession).filter_by(token_jti=payload["jti"]).first()
        )
        assert session_after is not None
        assert session_after.is_revoked is True

    def test_logout_token_cannot_be_reused(self, client: TestClient, test_user: User):
        """Test that token cannot be used after logout"""
        # Login
        credentials = {"username": test_user.username, "password": "TestPassword123!"}
        login_response = client.post("/api/auth/login", json=credentials)
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Logout
        logout_response = client.post("/api/auth/logout", headers=headers)
        assert logout_response.status_code == status.HTTP_200_OK

        # Try to use token again
        me_response = client.get("/api/auth/me", headers=headers)
        # Should fail because session is revoked
        assert me_response.status_code in [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        ]


class TestHealthCheckEndpoint:
    """Test suite for /api/auth/health endpoint"""

    def test_health_check_success(self, client: TestClient):
        """Test health check returns 200"""
        response = client.get("/api/auth/health")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert data["status"] == "healthy"
        assert data["service"] == "authentication"
        assert "version" in data

    def test_health_check_no_auth_required(self, client: TestClient):
        """Test health check does not require authentication"""
        # Should work without any headers
        response = client.get("/api/auth/health")

        assert response.status_code == status.HTTP_200_OK
