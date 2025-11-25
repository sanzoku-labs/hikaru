"""
Database models for user authentication and session management.
"""
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


def utc_now():
    """Return current UTC time - replaces deprecated datetime.utcnow()."""
    return datetime.now(timezone.utc)


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
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    uploads = relationship("Upload", back_populates="user", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, username={self.username})>"


class Session(Base):
    """Session model for tracking user sessions and JWT tokens."""

    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token_jti = Column(
        String(255), unique=True, index=True, nullable=False
    )  # JWT ID for token tracking
    created_at = Column(DateTime, default=utc_now, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    last_activity = Column(DateTime, default=utc_now, nullable=False)
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
    upload_id = Column(
        String(255), unique=True, index=True, nullable=False
    )  # UUID from existing system
    user_id = Column(
        Integer, ForeignKey("users.id"), nullable=True
    )  # Made nullable for backward compatibility
    filename = Column(String(255), nullable=False)
    file_size = Column(
        Integer, nullable=True
    )  # Size in bytes - nullable for backward compatibility
    uploaded_at = Column(DateTime, default=utc_now, nullable=False)
    expires_at = Column(
        DateTime, nullable=True
    )  # Auto-cleanup after 1 hour - nullable for backward compatibility

    # Data storage fields (replaces in-memory storage.py)
    schema_json = Column(Text, nullable=True)  # JSON string of DataSchema
    data_csv = Column(Text, nullable=True)  # CSV string of DataFrame
    upload_date = Column(
        DateTime, default=utc_now, nullable=False
    )  # Duplicate of uploaded_at for compatibility

    # Relationships
    user = relationship("User", back_populates="uploads")

    def __repr__(self):
        return f"<Upload(id={self.id}, upload_id={self.upload_id}, user_id={self.user_id}, filename={self.filename})>"


class Project(Base):
    """Project model for organizing multiple files into workspaces."""

    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)
    is_archived = Column(Boolean, default=False, nullable=False)

    # Relationships
    user = relationship("User", back_populates="projects")
    files = relationship("File", back_populates="project", cascade="all, delete-orphan")
    dashboards = relationship("Dashboard", back_populates="project", cascade="all, delete-orphan")
    relationships = relationship(
        "FileRelationship", back_populates="project", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Project(id={self.id}, name={self.name}, user_id={self.user_id})>"


class File(Base):
    """File model to track files within projects."""

    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    upload_id = Column(
        String(255), unique=True, index=True, nullable=False
    )  # Links to existing upload system
    file_path = Column(String(512), nullable=False)  # Storage path
    file_size = Column(Integer, nullable=False)  # Size in bytes
    row_count = Column(Integer, nullable=True)  # Number of rows in dataset
    schema_json = Column(Text, nullable=True)  # JSON string of column schema
    uploaded_at = Column(DateTime, default=utc_now, nullable=False)

    # Excel sheet support
    sheet_name = Column(String(255), nullable=True)  # For Excel files: which sheet
    sheet_index = Column(Integer, nullable=True, default=0)  # Sheet index (0-based)
    available_sheets_json = Column(Text, nullable=True)  # JSON array of sheet names

    # Analysis fields (for persistent analysis results)
    analysis_json = Column(
        Text, nullable=True
    )  # JSON string of analysis results (charts, insights)
    analysis_timestamp = Column(DateTime, nullable=True)  # When analysis was last run
    user_intent = Column(Text, nullable=True)  # User's intent when analysis was run

    # Relationships
    project = relationship("Project", back_populates="files")

    def __repr__(self):
        return f"<File(id={self.id}, filename={self.filename}, project_id={self.project_id})>"


class FileRelationship(Base):
    """FileRelationship model to define relationships between files (for merging/comparison)."""

    __tablename__ = "file_relationships"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    file_a_id = Column(Integer, ForeignKey("files.id"), nullable=False)
    file_b_id = Column(Integer, ForeignKey("files.id"), nullable=False)
    relationship_type = Column(String(50), nullable=False)  # 'comparison' or 'merge'
    config_json = Column(Text, nullable=True)  # JSON config: join_type, keys, suffixes, etc.
    created_at = Column(DateTime, default=utc_now, nullable=False)

    # Relationships
    project = relationship("Project", back_populates="relationships")
    file_a = relationship("File", foreign_keys=[file_a_id])
    file_b = relationship("File", foreign_keys=[file_b_id])

    def __repr__(self):
        return f"<FileRelationship(id={self.id}, type={self.relationship_type}, file_a={self.file_a_id}, file_b={self.file_b_id})>"


class Dashboard(Base):
    """Dashboard model to save chart configurations and analyses."""

    __tablename__ = "dashboards"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    name = Column(String(255), nullable=False)
    dashboard_type = Column(String(50), nullable=False)  # 'single_file', 'comparison', 'merged'
    config_json = Column(Text, nullable=False)  # JSON containing chart configs, file IDs, etc.
    chart_data = Column(Text, nullable=True)  # Cached chart data JSON
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    project = relationship("Project", back_populates="dashboards")

    def __repr__(self):
        return f"<Dashboard(id={self.id}, name={self.name}, type={self.dashboard_type}, project_id={self.project_id})>"


class ChartInsight(Base):
    """ChartInsight model to store AI-generated insights for individual charts."""

    __tablename__ = "chart_insights"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("files.id"), nullable=False)
    chart_hash = Column(String(64), index=True, nullable=False)  # MD5 of chart config
    chart_type = Column(String(20), nullable=False)  # line, bar, pie, scatter
    chart_title = Column(String(255), nullable=False)
    insight = Column(Text, nullable=False)
    insight_type = Column(String(20), default="basic", nullable=False)  # basic, advanced
    generated_at = Column(DateTime, default=utc_now, nullable=False)
    model_version = Column(String(50), nullable=False)  # e.g., claude-sonnet-4-20250514

    # Relationships
    file = relationship("File", backref="chart_insights")

    def __repr__(self):
        return f"<ChartInsight(id={self.id}, chart_title={self.chart_title}, type={self.chart_type})>"


class FileAnalysis(Base):
    """FileAnalysis model to store multiple analysis versions per file."""

    __tablename__ = "file_analyses"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("files.id"), nullable=False)

    # Analysis content
    analysis_json = Column(Text, nullable=False)  # JSON: {charts, global_summary, schema}
    user_intent = Column(Text, nullable=True)  # User's intent for this analysis
    sheet_name = Column(String(255), nullable=True)  # Which sheet was analyzed (for Excel)

    # Metadata
    created_at = Column(DateTime, default=utc_now, nullable=False)

    # Relationships
    file = relationship("File", backref="file_analyses")

    def __repr__(self):
        return f"<FileAnalysis(id={self.id}, file_id={self.file_id}, created_at={self.created_at})>"
