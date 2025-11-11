"""
Authentication service for user registration, login, and JWT token management.
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from sqlalchemy.orm import Session
from app.models.database import User, Session as SessionModel
from app.config import settings
import secrets


def hash_password(password: str) -> str:
    """
    Hash a plain-text password using bcrypt.

    Args:
        password: Plain-text password to hash

    Returns:
        Hashed password string
    """
    # Bcrypt has a 72-byte password limit, truncate if necessary
    password_bytes = password.encode('utf-8')[:72]
    # Generate salt and hash password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain-text password against a hashed password.

    Args:
        plain_password: Plain-text password to verify
        hashed_password: Hashed password from database

    Returns:
        True if password matches, False otherwise
    """
    # Truncate to match hashing behavior
    password_bytes = plain_password.encode('utf-8')[:72]
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.

    Args:
        data: Dictionary of claims to encode in the token (e.g., {"sub": user_id})
        expires_delta: Optional expiration time delta. Defaults to 7 days if not provided.

    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=settings.access_token_expire_days)

    # Add expiration and issued-at claims
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "jti": secrets.token_urlsafe(32)  # Unique token ID for tracking
    })

    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """
    Decode and validate a JWT access token.

    Args:
        token: JWT token string to decode

    Returns:
        Dictionary of token claims if valid, None if invalid or expired
    """
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except JWTError:
        return None


def create_user(db: Session, email: str, username: str, password: str, full_name: Optional[str] = None) -> User:
    """
    Create a new user in the database.

    Args:
        db: Database session
        email: User's email address
        username: User's username
        password: Plain-text password (will be hashed)
        full_name: Optional full name

    Returns:
        Created User object

    Raises:
        ValueError: If email or username already exists
    """
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise ValueError("Email already registered")

    # Check if username already exists
    existing_user = db.query(User).filter(User.username == username).first()
    if existing_user:
        raise ValueError("Username already taken")

    # Create new user
    hashed_password = hash_password(password)
    new_user = User(
        email=email,
        username=username,
        hashed_password=hashed_password,
        full_name=full_name,
        is_active=True,
        is_superuser=False
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """
    Authenticate a user by username and password.

    Args:
        db: Database session
        username: Username or email to authenticate
        password: Plain-text password

    Returns:
        User object if authentication successful, None otherwise
    """
    # Try to find user by username or email
    user = db.query(User).filter(
        (User.username == username) | (User.email == username)
    ).first()

    if not user:
        return None

    if not verify_password(password, user.hashed_password):
        return None

    if not user.is_active:
        return None

    return user


def create_session(
    db: Session,
    user_id: int,
    token_jti: str,
    expires_at: datetime,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> SessionModel:
    """
    Create a new session record for tracking.

    Args:
        db: Database session
        user_id: User ID
        token_jti: JWT token ID (jti claim)
        expires_at: Token expiration datetime
        ip_address: Optional IP address
        user_agent: Optional user agent string

    Returns:
        Created Session object
    """
    session = SessionModel(
        user_id=user_id,
        token_jti=token_jti,
        expires_at=expires_at,
        ip_address=ip_address,
        user_agent=user_agent,
        is_revoked=False
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    return session


def revoke_session(db: Session, token_jti: str) -> bool:
    """
    Revoke a session by token JTI.

    Args:
        db: Database session
        token_jti: JWT token ID to revoke

    Returns:
        True if session was revoked, False if not found
    """
    session = db.query(SessionModel).filter(SessionModel.token_jti == token_jti).first()
    if session:
        session.is_revoked = True
        db.commit()
        return True
    return False


def is_session_revoked(db: Session, token_jti: str) -> bool:
    """
    Check if a session has been revoked.

    Args:
        db: Database session
        token_jti: JWT token ID to check

    Returns:
        True if session is revoked, False otherwise
    """
    session = db.query(SessionModel).filter(SessionModel.token_jti == token_jti).first()
    return session.is_revoked if session else False


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    """
    Get a user by their ID.

    Args:
        db: Database session
        user_id: User ID to fetch

    Returns:
        User object if found, None otherwise
    """
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """
    Get a user by their email.

    Args:
        db: Database session
        email: Email to search for

    Returns:
        User object if found, None otherwise
    """
    return db.query(User).filter(User.email == email).first()


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """
    Get a user by their username.

    Args:
        db: Database session
        username: Username to search for

    Returns:
        User object if found, None otherwise
    """
    return db.query(User).filter(User.username == username).first()
