"""
Pytest configuration and shared fixtures.
"""
import os
from typing import Generator

import pytest
from fakeredis import FakeRedis
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
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


@pytest.fixture(scope="function")
def redis_client() -> Generator[FakeRedis, None, None]:
    """Create a fake Redis client for testing."""
    fake_redis = FakeRedis(decode_responses=True)
    yield fake_redis
    fake_redis.flushall()


@pytest.fixture
def test_user(db_session: Session) -> User:
    """Create a test user."""
    user = User(
        username="testuser",
        email="test@example.com",
        hashed_password=hash_password("testpassword123"),
        is_active=True,
        is_superuser=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def auth_token(test_user: User) -> str:
    """Create an authentication token for test user."""
    token = create_access_token(data={"sub": str(test_user.id)})
    return token


@pytest.fixture
def auth_headers(auth_token: str) -> dict:
    """Create authorization headers with bearer token."""
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture
def superuser(db_session: Session) -> User:
    """Create a superuser for testing admin endpoints."""
    user = User(
        username="admin",
        email="admin@example.com",
        hashed_password=hash_password("adminpassword123"),
        is_active=True,
        is_superuser=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def superuser_token(superuser: User) -> str:
    """Create an authentication token for superuser."""
    token = create_access_token(data={"sub": str(superuser.id)})
    return token


@pytest.fixture
def superuser_headers(superuser_token: str) -> dict:
    """Create authorization headers for superuser."""
    return {"Authorization": f"Bearer {superuser_token}"}


@pytest.fixture(autouse=True)
def setup_test_env():
    """Setup test environment variables."""
    os.environ["TESTING"] = "true"
    os.environ["DATABASE_URL"] = SQLALCHEMY_DATABASE_URL
    yield
    os.environ.pop("TESTING", None)
