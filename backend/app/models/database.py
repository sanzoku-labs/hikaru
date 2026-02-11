"""
Database models for user authentication and session management.
"""
from datetime import datetime, timezone
from typing import List

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, declarative_base, relationship

Base = declarative_base()


def utc_now():
    """Return current UTC time - replaces deprecated datetime.utcnow()."""
    return datetime.now(timezone.utc)


class User(Base):
    """User model for authentication."""

    __tablename__ = "users"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    email: Mapped[str] = Column(String(255), unique=True, index=True, nullable=False)
    username: Mapped[str] = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = Column(String(255), nullable=False)
    full_name: Mapped[str] = Column(String(255), nullable=True)
    is_active: Mapped[bool] = Column(Boolean, default=True, nullable=False)
    is_superuser: Mapped[bool] = Column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = Column(DateTime, default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = Column(
        DateTime, default=utc_now, onupdate=utc_now, nullable=False
    )

    # Relationships
    sessions: Mapped[List["Session"]] = relationship(
        "Session", back_populates="user", cascade="all, delete-orphan"
    )
    uploads: Mapped[List["Upload"]] = relationship(
        "Upload", back_populates="user", cascade="all, delete-orphan"
    )
    projects: Mapped[List["Project"]] = relationship(
        "Project", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, username={self.username})>"


class Session(Base):
    """Session model for tracking user sessions and JWT tokens."""

    __tablename__ = "sessions"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = Column(Integer, ForeignKey("users.id"), nullable=False)
    token_jti: Mapped[str] = Column(
        String(255), unique=True, index=True, nullable=False
    )  # JWT ID for token tracking
    created_at: Mapped[datetime] = Column(DateTime, default=utc_now, nullable=False)
    expires_at: Mapped[datetime] = Column(DateTime, nullable=False)
    last_activity: Mapped[datetime] = Column(DateTime, default=utc_now, nullable=False)
    ip_address: Mapped[str] = Column(String(45), nullable=True)  # IPv6 can be up to 45 chars
    user_agent: Mapped[str] = Column(Text, nullable=True)
    is_revoked: Mapped[bool] = Column(Boolean, default=False, nullable=False)

    # Relationships
    user: Mapped[User] = relationship("User", back_populates="sessions")

    def __repr__(self):
        return f"<Session(id={self.id}, user_id={self.user_id}, expires_at={self.expires_at})>"


class Upload(Base):
    """Upload model to track which user uploaded which file."""

    __tablename__ = "uploads"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    upload_id: Mapped[str] = Column(
        String(255), unique=True, index=True, nullable=False
    )  # UUID from existing system
    user_id: Mapped[int] = Column(
        Integer, ForeignKey("users.id"), nullable=True
    )  # Made nullable for backward compatibility
    filename: Mapped[str] = Column(String(255), nullable=False)
    file_size: Mapped[int] = Column(
        Integer, nullable=True
    )  # Size in bytes - nullable for backward compatibility
    uploaded_at: Mapped[datetime] = Column(DateTime, default=utc_now, nullable=False)
    expires_at: Mapped[datetime] = Column(
        DateTime, nullable=True
    )  # Auto-cleanup after 1 hour - nullable for backward compatibility

    # Data storage fields (replaces in-memory storage.py)
    schema_json: Mapped[str] = Column(Text, nullable=True)  # JSON string of DataSchema
    data_csv: Mapped[str] = Column(Text, nullable=True)  # CSV string of DataFrame
    upload_date: Mapped[datetime] = Column(
        DateTime, default=utc_now, nullable=False
    )  # Duplicate of uploaded_at for compatibility

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="uploads")

    def __repr__(self):
        return f"<Upload(id={self.id}, upload_id={self.upload_id}, user_id={self.user_id}, filename={self.filename})>"


class Project(Base):
    """Project model for organizing multiple files into workspaces."""

    __tablename__ = "projects"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    name: Mapped[str] = Column(String(255), nullable=False)
    description: Mapped[str] = Column(Text, nullable=True)
    user_id: Mapped[int] = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = Column(DateTime, default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = Column(
        DateTime, default=utc_now, onupdate=utc_now, nullable=False
    )
    is_archived: Mapped[bool] = Column(Boolean, default=False, nullable=False)

    # Relationships
    user: Mapped[User] = relationship("User", back_populates="projects")
    files: Mapped[List["File"]] = relationship(
        "File", back_populates="project", cascade="all, delete-orphan"
    )
    dashboards: Mapped[List["Dashboard"]] = relationship(
        "Dashboard", back_populates="project", cascade="all, delete-orphan"
    )
    relationships: Mapped[List["FileRelationship"]] = relationship(
        "FileRelationship", back_populates="project", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Project(id={self.id}, name={self.name}, user_id={self.user_id})>"


class File(Base):
    """File model to track files within projects."""

    __tablename__ = "files"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    project_id: Mapped[int] = Column(Integer, ForeignKey("projects.id"), nullable=False)
    filename: Mapped[str] = Column(String(255), nullable=False)
    upload_id: Mapped[str] = Column(
        String(255), unique=True, index=True, nullable=False
    )  # Links to existing upload system
    file_path: Mapped[str] = Column(String(512), nullable=False)  # Storage path
    file_size: Mapped[int] = Column(Integer, nullable=False)  # Size in bytes
    row_count: Mapped[int] = Column(Integer, nullable=True)  # Number of rows in dataset
    schema_json: Mapped[str] = Column(Text, nullable=True)  # JSON string of column schema
    uploaded_at: Mapped[datetime] = Column(DateTime, default=utc_now, nullable=False)

    # Excel sheet support
    sheet_name: Mapped[str] = Column(String(255), nullable=True)
    sheet_index: Mapped[int] = Column(Integer, nullable=True, default=0)
    available_sheets_json: Mapped[str] = Column(Text, nullable=True)

    # Analysis fields (for persistent analysis results)
    analysis_json: Mapped[str] = Column(
        Text, nullable=True
    )  # JSON string of analysis results (charts, insights)
    analysis_timestamp: Mapped[datetime] = Column(DateTime, nullable=True)
    user_intent: Mapped[str] = Column(Text, nullable=True)

    # Relationships
    project: Mapped[Project] = relationship("Project", back_populates="files")

    def __repr__(self):
        return f"<File(id={self.id}, filename={self.filename}, project_id={self.project_id})>"


class FileRelationship(Base):
    """FileRelationship model to define relationships between files (for merging/comparison)."""

    __tablename__ = "file_relationships"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    project_id: Mapped[int] = Column(Integer, ForeignKey("projects.id"), nullable=False)
    file_a_id: Mapped[int] = Column(Integer, ForeignKey("files.id"), nullable=False)
    file_b_id: Mapped[int] = Column(Integer, ForeignKey("files.id"), nullable=False)
    relationship_type: Mapped[str] = Column(String(50), nullable=False)
    config_json: Mapped[str] = Column(Text, nullable=True)
    created_at: Mapped[datetime] = Column(DateTime, default=utc_now, nullable=False)

    # Relationships
    project: Mapped[Project] = relationship("Project", back_populates="relationships")
    file_a: Mapped[File] = relationship("File", foreign_keys=[file_a_id])
    file_b: Mapped[File] = relationship("File", foreign_keys=[file_b_id])

    def __repr__(self):
        return f"<FileRelationship(id={self.id}, type={self.relationship_type}, file_a={self.file_a_id}, file_b={self.file_b_id})>"


class Dashboard(Base):
    """Dashboard model to save chart configurations and analyses."""

    __tablename__ = "dashboards"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    project_id: Mapped[int] = Column(Integer, ForeignKey("projects.id"), nullable=False)
    name: Mapped[str] = Column(String(255), nullable=False)
    dashboard_type: Mapped[str] = Column(String(50), nullable=False)
    config_json: Mapped[str] = Column(Text, nullable=False)
    chart_data: Mapped[str] = Column(Text, nullable=True)
    created_at: Mapped[datetime] = Column(DateTime, default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = Column(
        DateTime, default=utc_now, onupdate=utc_now, nullable=False
    )

    # Relationships
    project: Mapped[Project] = relationship("Project", back_populates="dashboards")

    def __repr__(self):
        return f"<Dashboard(id={self.id}, name={self.name}, type={self.dashboard_type}, project_id={self.project_id})>"


class ChartInsight(Base):
    """ChartInsight model to store AI-generated insights for individual charts."""

    __tablename__ = "chart_insights"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    file_id: Mapped[int] = Column(Integer, ForeignKey("files.id"), nullable=False)
    chart_hash: Mapped[str] = Column(String(64), index=True, nullable=False)
    chart_type: Mapped[str] = Column(String(20), nullable=False)
    chart_title: Mapped[str] = Column(String(255), nullable=False)
    insight: Mapped[str] = Column(Text, nullable=False)
    insight_type: Mapped[str] = Column(String(20), default="basic", nullable=False)
    generated_at: Mapped[datetime] = Column(DateTime, default=utc_now, nullable=False)
    model_version: Mapped[str] = Column(String(50), nullable=False)

    # Relationships
    file: Mapped[File] = relationship("File", backref="chart_insights")

    def __repr__(self):
        return (
            f"<ChartInsight(id={self.id}, chart_title={self.chart_title}, type={self.chart_type})>"
        )


class FileAnalysis(Base):
    """FileAnalysis model to store multiple analysis versions per file."""

    __tablename__ = "file_analyses"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    file_id: Mapped[int] = Column(Integer, ForeignKey("files.id"), nullable=False)

    # Analysis content
    analysis_json: Mapped[str] = Column(Text, nullable=False)
    user_intent: Mapped[str] = Column(Text, nullable=True)
    sheet_name: Mapped[str] = Column(String(255), nullable=True)

    # Metadata
    created_at: Mapped[datetime] = Column(DateTime, default=utc_now, nullable=False)

    # Relationships
    file: Mapped[File] = relationship("File", backref="file_analyses")

    def __repr__(self):
        return f"<FileAnalysis(id={self.id}, file_id={self.file_id}, created_at={self.created_at})>"


class Conversation(Base):
    """Conversation model for AI Assistant cross-file queries."""

    __tablename__ = "conversations"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    conversation_id: Mapped[str] = Column(String(36), unique=True, index=True, nullable=False)
    user_id: Mapped[int] = Column(Integer, ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = Column(String(255), nullable=True)
    file_context_json: Mapped[str] = Column(Text, nullable=True)
    created_at: Mapped[datetime] = Column(DateTime, default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = Column(
        DateTime, default=utc_now, onupdate=utc_now, nullable=False
    )

    # Relationships
    user: Mapped[User] = relationship("User", backref="conversations")
    messages: Mapped[List["ConversationMessage"]] = relationship(
        "ConversationMessage", back_populates="conversation", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Conversation(id={self.id}, conversation_id={self.conversation_id}, title={self.title})>"


class ConversationMessage(Base):
    """ConversationMessage model for storing individual messages in AI conversations."""

    __tablename__ = "conversation_messages"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    conversation_id: Mapped[int] = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    role: Mapped[str] = Column(String(20), nullable=False)  # 'user' or 'assistant'
    content: Mapped[str] = Column(Text, nullable=False)
    chart_json: Mapped[str] = Column(Text, nullable=True)
    created_at: Mapped[datetime] = Column(DateTime, default=utc_now, nullable=False)

    # Relationships
    conversation: Mapped[Conversation] = relationship("Conversation", back_populates="messages")

    def __repr__(self):
        return f"<ConversationMessage(id={self.id}, role={self.role}, conversation_id={self.conversation_id})>"


class Integration(Base):
    """Integration model for third-party data source connections."""

    __tablename__ = "integrations"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Provider info
    provider: Mapped[str] = Column(String(50), nullable=False)
    provider_account_id: Mapped[str] = Column(String(255), nullable=True)
    provider_email: Mapped[str] = Column(String(255), nullable=True)

    # OAuth tokens (encrypted in production)
    access_token: Mapped[str] = Column(Text, nullable=False)
    refresh_token: Mapped[str] = Column(Text, nullable=True)
    token_expires_at: Mapped[datetime] = Column(DateTime, nullable=True)

    # Metadata
    scopes: Mapped[str] = Column(Text, nullable=True)
    is_active: Mapped[bool] = Column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = Column(DateTime, default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = Column(
        DateTime, default=utc_now, onupdate=utc_now, nullable=False
    )
    last_used_at: Mapped[datetime] = Column(DateTime, nullable=True)

    # Relationships
    user: Mapped[User] = relationship("User", backref="integrations")

    def __repr__(self):
        return f"<Integration(id={self.id}, provider={self.provider}, user_id={self.user_id})>"
