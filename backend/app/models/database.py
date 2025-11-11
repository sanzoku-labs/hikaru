"""
Database models for user authentication and session management.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class User(Base):
    """User model for authentication."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    uploads = relationship("Upload", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, username={self.username})>"


class Session(Base):
    """Session model for tracking user sessions and JWT tokens."""
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token_jti = Column(String(255), unique=True, index=True, nullable=False)  # JWT ID for token tracking
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    last_activity = Column(DateTime, default=datetime.utcnow, nullable=False)
    ip_address = Column(String(45), nullable=True)  # IPv6 can be up to 45 chars
    user_agent = Column(Text, nullable=True)
    is_revoked = Column(Boolean, default=False, nullable=False)

    # Relationships
    user = relationship("User", back_populates="sessions")

    def __repr__(self):
        return f"<Session(id={self.id}, user_id={self.user_id}, expires_at={self.expires_at})>"


class Upload(Base):
    """Upload model to track which user uploaded which file."""
    __tablename__ = "uploads"

    id = Column(Integer, primary_key=True, index=True)
    upload_id = Column(String(255), unique=True, index=True, nullable=False)  # UUID from existing system
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)  # Size in bytes
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)  # Auto-cleanup after 1 hour

    # Relationships
    user = relationship("User", back_populates="uploads")

    def __repr__(self):
        return f"<Upload(id={self.id}, upload_id={self.upload_id}, user_id={self.user_id}, filename={self.filename})>"
