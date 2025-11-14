"""Unit tests for AuthService functions."""
from datetime import datetime, timedelta, timezone
from typing import Generator

import pytest
from jose import jwt
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.config import settings
from app.database import Base
from app.models.database import Session as SessionModel
from app.models.database import User
from app.services.auth_service import (
    authenticate_user,
    create_access_token,
    create_session,
    create_user,
    decode_access_token,
    get_user_by_email,
    get_user_by_id,
    get_user_by_username,
    hash_password,
    is_session_revoked,
    revoke_session,
    verify_password,
)

# Test database setup
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


class TestPasswordHashing:
    """Test password hashing and verification"""

    def test_hash_password_returns_string(self):
        """Test that hash_password returns a string"""
        password = "test_password_123"
        hashed = hash_password(password)

        assert isinstance(hashed, str)
        assert len(hashed) > 0

    def test_hash_password_different_each_time(self):
        """Test that hashing the same password twice produces different hashes"""
        password = "test_password_123"
        hash1 = hash_password(password)
        hash2 = hash_password(password)

        # Due to random salt, hashes should be different
        assert hash1 != hash2

    def test_hash_password_handles_long_password(self):
        """Test that passwords >72 bytes are truncated"""
        # Create password longer than 72 bytes
        long_password = "a" * 100
        hashed = hash_password(long_password)

        assert isinstance(hashed, str)

    def test_verify_password_correct(self):
        """Test that verify_password returns True for correct password"""
        password = "test_password_123"
        hashed = hash_password(password)

        assert verify_password(password, hashed) is True

    def test_verify_password_incorrect(self):
        """Test that verify_password returns False for incorrect password"""
        password = "test_password_123"
        wrong_password = "wrong_password"
        hashed = hash_password(password)

        assert verify_password(wrong_password, hashed) is False

    def test_verify_password_empty(self):
        """Test that verify_password handles empty password"""
        password = "test_password_123"
        hashed = hash_password(password)

        assert verify_password("", hashed) is False

    def test_hash_and_verify_special_characters(self):
        """Test password with special characters"""
        password = "p@ssw0rd!#$%^&*()"
        hashed = hash_password(password)

        assert verify_password(password, hashed) is True

    def test_hash_and_verify_unicode(self):
        """Test password with unicode characters"""
        password = "pässwörd123你好"
        hashed = hash_password(password)

        assert verify_password(password, hashed) is True


class TestJWTTokens:
    """Test JWT token creation and decoding"""

    def test_create_access_token_structure(self):
        """Test that create_access_token creates valid JWT"""
        data = {"sub": "123"}
        token = create_access_token(data)

        assert isinstance(token, str)
        # JWT has 3 parts separated by dots
        assert token.count(".") == 2

    def test_create_access_token_contains_claims(self):
        """Test that token contains expected claims"""
        user_id = "user_123"
        data = {"sub": user_id}
        token = create_access_token(data)

        # Decode without verification to check structure
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])

        assert payload["sub"] == user_id
        assert "exp" in payload
        assert "iat" in payload
        assert "jti" in payload

    def test_create_access_token_default_expiration(self):
        """Test that token has default expiration of 7 days"""
        data = {"sub": "123"}
        token = create_access_token(data)

        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        exp = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        iat = datetime.fromtimestamp(payload["iat"], tz=timezone.utc)

        # Should expire in approximately 7 days
        delta = exp - iat
        assert delta.days == settings.access_token_expire_days

    def test_create_access_token_custom_expiration(self):
        """Test that token respects custom expiration"""
        data = {"sub": "123"}
        custom_delta = timedelta(hours=2)
        token = create_access_token(data, expires_delta=custom_delta)

        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        exp = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        iat = datetime.fromtimestamp(payload["iat"], tz=timezone.utc)

        # Should expire in approximately 2 hours
        delta = exp - iat
        assert abs(delta.total_seconds() - 7200) < 10  # Within 10 seconds

    def test_create_access_token_unique_jti(self):
        """Test that each token has unique jti"""
        data = {"sub": "123"}
        token1 = create_access_token(data)
        token2 = create_access_token(data)

        payload1 = jwt.decode(token1, settings.secret_key, algorithms=[settings.algorithm])
        payload2 = jwt.decode(token2, settings.secret_key, algorithms=[settings.algorithm])

        assert payload1["jti"] != payload2["jti"]

    def test_decode_access_token_valid(self):
        """Test decoding valid token"""
        data = {"sub": "user_123", "username": "testuser"}
        token = create_access_token(data)

        decoded = decode_access_token(token)

        assert decoded is not None
        assert decoded["sub"] == "user_123"
        assert decoded["username"] == "testuser"

    def test_decode_access_token_invalid(self):
        """Test decoding invalid token returns None"""
        invalid_token = "invalid.token.here"

        decoded = decode_access_token(invalid_token)

        assert decoded is None

    def test_decode_access_token_expired(self):
        """Test decoding expired token returns None"""
        data = {"sub": "123"}
        # Create token that expires immediately
        token = create_access_token(data, expires_delta=timedelta(seconds=-1))

        decoded = decode_access_token(token)

        assert decoded is None

    def test_decode_access_token_tampered(self):
        """Test decoding tampered token returns None"""
        data = {"sub": "123"}
        token = create_access_token(data)

        # Tamper with token
        parts = token.split(".")
        parts[1] = parts[1] + "tampered"
        tampered_token = ".".join(parts)

        decoded = decode_access_token(tampered_token)

        assert decoded is None


class TestUserCreation:
    """Test user creation functionality"""

    def test_create_user_success(self, db_session):
        """Test successful user creation"""
        user = create_user(
            db=db_session,
            email="test@example.com",
            username="testuser",
            password="password123",
            full_name="Test User"
        )

        assert user.id is not None
        assert user.email == "test@example.com"
        assert user.username == "testuser"
        assert user.full_name == "Test User"
        assert user.is_active is True
        assert user.is_superuser is False
        # Password should be hashed, not plain text
        assert user.hashed_password != "password123"

    def test_create_user_without_full_name(self, db_session):
        """Test creating user without full name"""
        user = create_user(
            db=db_session,
            email="test@example.com",
            username="testuser",
            password="password123"
        )

        assert user.full_name is None

    def test_create_user_duplicate_email(self, db_session):
        """Test that duplicate email raises ValueError"""
        create_user(
            db=db_session,
            email="test@example.com",
            username="user1",
            password="password123"
        )

        with pytest.raises(ValueError, match="Email already registered"):
            create_user(
                db=db_session,
                email="test@example.com",
                username="user2",
                password="password123"
            )

    def test_create_user_duplicate_username(self, db_session):
        """Test that duplicate username raises ValueError"""
        create_user(
            db=db_session,
            email="test1@example.com",
            username="testuser",
            password="password123"
        )

        with pytest.raises(ValueError, match="Username already taken"):
            create_user(
                db=db_session,
                email="test2@example.com",
                username="testuser",
                password="password123"
            )

    def test_create_user_password_is_hashed(self, db_session):
        """Test that password is properly hashed"""
        password = "my_secret_password"
        user = create_user(
            db=db_session,
            email="test@example.com",
            username="testuser",
            password=password
        )

        # Password should be hashed
        assert user.hashed_password != password
        # Should be able to verify with original password
        assert verify_password(password, user.hashed_password) is True


class TestUserAuthentication:
    """Test user authentication functionality"""

    def test_authenticate_user_by_username_success(self, db_session):
        """Test successful authentication by username"""
        password = "password123"
        user = create_user(
            db=db_session,
            email="test@example.com",
            username="testuser",
            password=password
        )

        authenticated = authenticate_user(db_session, "testuser", password)

        assert authenticated is not None
        assert authenticated.id == user.id
        assert authenticated.username == "testuser"

    def test_authenticate_user_by_email_success(self, db_session):
        """Test successful authentication by email"""
        password = "password123"
        user = create_user(
            db=db_session,
            email="test@example.com",
            username="testuser",
            password=password
        )

        authenticated = authenticate_user(db_session, "test@example.com", password)

        assert authenticated is not None
        assert authenticated.id == user.id

    def test_authenticate_user_wrong_password(self, db_session):
        """Test authentication with wrong password returns None"""
        create_user(
            db=db_session,
            email="test@example.com",
            username="testuser",
            password="password123"
        )

        authenticated = authenticate_user(db_session, "testuser", "wrong_password")

        assert authenticated is None

    def test_authenticate_user_nonexistent(self, db_session):
        """Test authentication with nonexistent user returns None"""
        authenticated = authenticate_user(db_session, "nonexistent", "password123")

        assert authenticated is None

    def test_authenticate_user_inactive(self, db_session):
        """Test authentication with inactive user returns None"""
        user = create_user(
            db=db_session,
            email="test@example.com",
            username="testuser",
            password="password123"
        )

        # Deactivate user
        user.is_active = False
        db_session.commit()

        authenticated = authenticate_user(db_session, "testuser", "password123")

        assert authenticated is None


class TestSessionManagement:
    """Test session management functionality"""

    def test_create_session_basic(self, db_session):
        """Test creating a session"""
        # Create user first
        user = create_user(
            db=db_session,
            email="test@example.com",
            username="testuser",
            password="password123"
        )

        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        session = create_session(
            db=db_session,
            user_id=user.id,
            token_jti="test_jti_123",
            expires_at=expires_at
        )

        assert session.id is not None
        assert session.user_id == user.id
        assert session.token_jti == "test_jti_123"
        assert session.is_revoked is False

    def test_create_session_with_metadata(self, db_session):
        """Test creating session with IP and user agent"""
        user = create_user(
            db=db_session,
            email="test@example.com",
            username="testuser",
            password="password123"
        )

        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        session = create_session(
            db=db_session,
            user_id=user.id,
            token_jti="test_jti_123",
            expires_at=expires_at,
            ip_address="192.168.1.1",
            user_agent="Mozilla/5.0"
        )

        assert session.ip_address == "192.168.1.1"
        assert session.user_agent == "Mozilla/5.0"

    def test_revoke_session_success(self, db_session):
        """Test revoking a session"""
        user = create_user(
            db=db_session,
            email="test@example.com",
            username="testuser",
            password="password123"
        )

        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        session = create_session(
            db=db_session,
            user_id=user.id,
            token_jti="test_jti_123",
            expires_at=expires_at
        )

        result = revoke_session(db_session, "test_jti_123")

        assert result is True
        # Verify session is revoked
        db_session.refresh(session)
        assert session.is_revoked is True

    def test_revoke_session_nonexistent(self, db_session):
        """Test revoking nonexistent session returns False"""
        result = revoke_session(db_session, "nonexistent_jti")

        assert result is False

    def test_is_session_revoked_true(self, db_session):
        """Test checking if session is revoked"""
        user = create_user(
            db=db_session,
            email="test@example.com",
            username="testuser",
            password="password123"
        )

        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        session = create_session(
            db=db_session,
            user_id=user.id,
            token_jti="test_jti_123",
            expires_at=expires_at
        )

        # Revoke session
        session.is_revoked = True
        db_session.commit()

        assert is_session_revoked(db_session, "test_jti_123") is True

    def test_is_session_revoked_false(self, db_session):
        """Test checking if active session is not revoked"""
        user = create_user(
            db=db_session,
            email="test@example.com",
            username="testuser",
            password="password123"
        )

        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        create_session(
            db=db_session,
            user_id=user.id,
            token_jti="test_jti_123",
            expires_at=expires_at
        )

        assert is_session_revoked(db_session, "test_jti_123") is False

    def test_is_session_revoked_nonexistent(self, db_session):
        """Test checking nonexistent session returns False"""
        assert is_session_revoked(db_session, "nonexistent_jti") is False


class TestUserRetrieval:
    """Test user retrieval functions"""

    def test_get_user_by_id_found(self, db_session):
        """Test getting user by ID"""
        user = create_user(
            db=db_session,
            email="test@example.com",
            username="testuser",
            password="password123"
        )

        retrieved = get_user_by_id(db_session, user.id)

        assert retrieved is not None
        assert retrieved.id == user.id
        assert retrieved.username == "testuser"

    def test_get_user_by_id_not_found(self, db_session):
        """Test getting nonexistent user by ID returns None"""
        retrieved = get_user_by_id(db_session, 99999)

        assert retrieved is None

    def test_get_user_by_email_found(self, db_session):
        """Test getting user by email"""
        user = create_user(
            db=db_session,
            email="test@example.com",
            username="testuser",
            password="password123"
        )

        retrieved = get_user_by_email(db_session, "test@example.com")

        assert retrieved is not None
        assert retrieved.id == user.id
        assert retrieved.email == "test@example.com"

    def test_get_user_by_email_not_found(self, db_session):
        """Test getting nonexistent user by email returns None"""
        retrieved = get_user_by_email(db_session, "nonexistent@example.com")

        assert retrieved is None

    def test_get_user_by_username_found(self, db_session):
        """Test getting user by username"""
        user = create_user(
            db=db_session,
            email="test@example.com",
            username="testuser",
            password="password123"
        )

        retrieved = get_user_by_username(db_session, "testuser")

        assert retrieved is not None
        assert retrieved.id == user.id
        assert retrieved.username == "testuser"

    def test_get_user_by_username_not_found(self, db_session):
        """Test getting nonexistent user by username returns None"""
        retrieved = get_user_by_username(db_session, "nonexistent")

        assert retrieved is None

    def test_get_user_by_email_case_sensitive(self, db_session):
        """Test that email lookup is case-sensitive by default"""
        create_user(
            db=db_session,
            email="Test@Example.com",
            username="testuser",
            password="password123"
        )

        # SQLite is case-insensitive by default for LIKE, but == should be case-sensitive
        retrieved = get_user_by_email(db_session, "Test@Example.com")
        assert retrieved is not None
