from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

# ===== Phase 8: Authentication Schemas =====


class UserRegister(BaseModel):
    """Request schema for user registration."""

    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50, pattern="^[a-zA-Z0-9_-]+$")
    password: str = Field(..., min_length=8, max_length=72)  # Bcrypt limit
    full_name: Optional[str] = Field(None, max_length=255)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        """Ensure password meets strength requirements"""
        # Check byte length (bcrypt limit is 72 bytes)
        if len(v.encode("utf-8")) > 72:
            raise ValueError("Password cannot be longer than 72 bytes")
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class UserLogin(BaseModel):
    """Request schema for user login."""

    username: str  # Can be username or email
    password: str


class UserResponse(BaseModel):
    """Response schema for user information."""

    id: int
    email: str
    username: str
    full_name: Optional[str]
    is_active: bool
    is_superuser: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    """Response schema for login (JWT token)."""

    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ===== Phase 1: Upload Schemas =====


class ColumnInfo(BaseModel):
    name: str
    type: Literal["numeric", "categorical", "datetime"]
    null_count: int
    unique_values: Optional[int] = None
    sample_values: List[Any]
    # For numeric columns
    min: Optional[float] = None
    max: Optional[float] = None
    mean: Optional[float] = None
    median: Optional[float] = None


class DataSchema(BaseModel):
    columns: List[ColumnInfo]
    row_count: int
    preview: List[Dict[str, Any]]  # First 10 rows


class UploadResponse(BaseModel):
    upload_id: str
    filename: str
    data_schema: DataSchema
    upload_timestamp: datetime


class ErrorResponse(BaseModel):
    error: str
    detail: str
    code: Optional[str] = None


# Phase 2: Chart Generation Schemas
class ChartData(BaseModel):
    chart_type: Literal["line", "bar", "pie", "scatter"]
    title: str
    x_column: Optional[str] = None
    y_column: Optional[str] = None
    category_column: Optional[str] = None
    value_column: Optional[str] = None
    data: List[Dict[str, Any]]
    priority: int
    insight: Optional[str] = None  # Phase 3: AI-generated insight
    comparison_insight: Optional[str] = None  # Phase 7: Comparison-specific insight


class AnalyzeResponse(BaseModel):
    upload_id: str
    filename: str
    data_schema: DataSchema
    charts: List[ChartData]
    upload_timestamp: datetime
    global_summary: Optional[str] = None  # Phase 3: Overall AI summary


class AnalyzeRequest(BaseModel):
    """Request schema for analyzing uploaded data."""

    user_intent: Optional[str] = None  # Optional: What the user wants to analyze


# Phase 4: Q&A Interface Schemas
class QueryRequest(BaseModel):
    upload_id: str
    question: str
    conversation_id: Optional[str] = None  # For tracking conversation context


class ConversationMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str
    timestamp: datetime


class QueryResponse(BaseModel):
    answer: str
    conversation_id: str
    timestamp: datetime
    chart: Optional[ChartData] = None  # Phase 4B: Generated chart if requested


# Phase 5: PDF Export Schemas
class ExportRequest(BaseModel):
    upload_id: str


class ExportResponse(BaseModel):
    export_id: str
    download_url: str
    filename: str
    generated_at: datetime


# Phase 5B: Advanced Export Schemas (Mockup 6)
class AdvancedExportRequest(BaseModel):
    """Request schema for advanced export with custom options."""

    project_id: Optional[int] = None  # For project exports
    file_id: Optional[int] = None  # For single file exports
    upload_id: Optional[str] = None  # Legacy support

    export_format: Literal["pdf", "png", "excel"] = "pdf"

    # Export content options
    include_charts: bool = True
    include_insights: bool = True
    include_raw_data: bool = False
    include_summary: bool = True

    # Customization
    custom_filename: Optional[str] = None
    custom_title: Optional[str] = None

    # Chart-specific options
    chart_ids: Optional[List[int]] = None  # Specific charts to include (None = all)

    @field_validator("export_format")
    @classmethod
    def validate_export_format(cls, v):
        """Ensure export format is supported."""
        supported_formats = ["pdf", "png", "excel"]
        if v not in supported_formats:
            raise ValueError(f"Export format must be one of: {', '.join(supported_formats)}")
        return v


class AdvancedExportResponse(BaseModel):
    """Response schema for advanced export."""

    export_id: str
    download_url: str
    filename: str
    file_size: Optional[int] = None  # Size in bytes
    export_format: str
    generated_at: datetime
    expires_at: datetime  # When export will be deleted


# ===== Phase 7: Projects & Multi-File Workspaces Schemas =====


# Phase 7A: Project Management
class ProjectCreate(BaseModel):
    """Request schema for creating a new project."""

    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)


class ProjectUpdate(BaseModel):
    """Request schema for updating an existing project."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    is_archived: Optional[bool] = None


class FileInProject(BaseModel):
    """Schema for file metadata within a project."""

    id: int
    project_id: int
    filename: str
    upload_id: str
    file_size: int
    row_count: Optional[int]
    data_schema_json: Optional[str]
    uploaded_at: datetime
    has_analysis: bool = False  # Whether analysis has been performed
    analyzed_at: Optional[datetime] = None  # When analysis was last run

    model_config = ConfigDict(from_attributes=True)


class ProjectResponse(BaseModel):
    """Response schema for project information."""

    id: int
    name: str
    description: Optional[str]
    user_id: int
    created_at: datetime
    updated_at: datetime
    is_archived: bool
    file_count: Optional[int] = None  # Optional computed field
    files: Optional[List[FileInProject]] = None  # Optional when listing

    model_config = ConfigDict(from_attributes=True)


class ProjectListResponse(BaseModel):
    """Response schema for listing projects."""

    projects: List[ProjectResponse]
    total: int


class ProjectFileUploadResponse(BaseModel):
    """Response schema after uploading file to project."""

    file_id: int
    upload_id: str
    filename: str
    file_size: int
    row_count: Optional[int] = None  # Null for Excel files until analyzed
    data_schema: Optional[DataSchema] = None  # Null for Excel files until analyzed
    uploaded_at: datetime


# Phase 7B: File Comparison
class ComparisonRequest(BaseModel):
    """Request schema for comparing two files."""

    file_a_id: int
    file_b_id: int
    comparison_type: Literal["trend", "yoy", "side_by_side"] = "side_by_side"


class OverlayChartData(BaseModel):
    """Schema for overlay chart with data from two files."""

    chart_type: Literal["line", "bar", "scatter"]
    title: str
    file_a_name: str
    file_b_name: str
    x_column: str
    y_column: str
    file_a_data: List[Dict[str, Any]]
    file_b_data: List[Dict[str, Any]]
    comparison_insight: Optional[str] = None


class ComparisonResponse(BaseModel):
    """Response schema for file comparison."""

    comparison_id: int
    file_a: FileInProject
    file_b: FileInProject
    comparison_type: str
    overlay_charts: List[OverlayChartData]
    summary_insight: str
    created_at: datetime


# Phase 7C: File Merging
class RelationshipCreate(BaseModel):
    """Request schema for creating a file relationship (for merging)."""

    file_a_id: int
    file_b_id: int
    join_type: Literal["inner", "left", "right", "outer"] = "inner"
    left_key: str  # Column name in file_a
    right_key: str  # Column name in file_b
    left_suffix: str = "_a"
    right_suffix: str = "_b"


class RelationshipResponse(BaseModel):
    """Response schema for file relationship."""

    id: int
    project_id: int
    file_a_id: int
    file_b_id: int
    relationship_type: str
    config_json: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MergeAnalyzeRequest(BaseModel):
    """Request schema for analyzing merged data."""

    relationship_id: int


class MergeAnalyzeResponse(BaseModel):
    """Response schema for merged data analysis."""

    relationship_id: int
    merged_row_count: int
    merged_schema: DataSchema
    charts: List[ChartData]
    global_summary: Optional[str] = None


# Dashboard schemas
class DashboardCreate(BaseModel):
    """Request schema for creating a dashboard."""

    name: str = Field(..., min_length=1, max_length=255)
    dashboard_type: Literal["single_file", "comparison", "merged"]
    config_json: str  # JSON string with chart configs, file IDs, etc.


class DashboardUpdate(BaseModel):
    """Request schema for updating a dashboard."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    config_json: Optional[str] = None
    chart_data: Optional[str] = None


class DashboardResponse(BaseModel):
    """Response schema for dashboard information."""

    id: int
    project_id: int
    name: str
    dashboard_type: str
    config_json: str
    chart_data: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DashboardListResponse(BaseModel):
    """Response schema for listing dashboards in a project."""

    dashboards: List[DashboardResponse]
    total: int


# Analysis History schemas
class AnalysisHistoryItem(BaseModel):
    """Schema for a single analysis history entry."""

    analysis_id: str  # Generated from timestamp
    file_id: int
    filename: str
    charts_count: int
    user_intent: Optional[str] = None
    analyzed_at: datetime
    has_global_summary: bool


class AnalysisHistoryResponse(BaseModel):
    """Response schema for analysis history."""

    file_id: int
    filename: str
    total_analyses: int
    analyses: List[AnalysisHistoryItem]


# Phase 7D: File Analysis (Persistent Analysis Results)
class FileAnalyzeRequest(BaseModel):
    """Request schema for analyzing a file in a project."""

    user_intent: Optional[str] = Field(
        None, max_length=500, description="User's intent or question for analysis"
    )
    sheet_name: Optional[str] = Field(
        None, max_length=255, description="For Excel files: which sheet to analyze"
    )


class FileAnalysisResponse(BaseModel):
    """Response schema for file analysis results."""

    file_id: int
    filename: str
    charts: List[ChartData]
    global_summary: Optional[str] = None
    user_intent: Optional[str] = None
    analyzed_at: datetime


# Multi-Analysis Schemas (for FileAnalysis table)
class SavedAnalysisSummary(BaseModel):
    """Summary of a saved analysis for list view."""

    analysis_id: int
    user_intent: Optional[str] = None
    charts_count: int
    created_at: datetime


class SavedAnalysisDetail(BaseModel):
    """Full details of a saved analysis."""

    analysis_id: int
    file_id: int
    filename: str
    charts: List[ChartData]
    global_summary: Optional[str] = None
    user_intent: Optional[str] = None
    created_at: datetime


# Multi-Sheet Excel Support Schemas
class SheetInfo(BaseModel):
    """Schema for Excel sheet metadata."""

    name: str
    index: int
    is_hidden: bool
    row_count: int
    column_count: int
    preview: Optional[List[Dict[str, Any]]] = None  # First 3 rows (optional)
    has_numeric: Optional[bool] = None  # Whether sheet has numeric columns
    error: Optional[str] = None  # If sheet failed to load


class AnalysisListResponse(BaseModel):
    """Response for listing all analyses for a file."""

    file_id: int
    filename: str
    total_analyses: int
    analyses: List[SavedAnalysisSummary]


# Analytics Dashboard Schemas
class RecentAnalysis(BaseModel):
    """Schema for recent analysis item in analytics."""

    file_id: int
    filename: str
    project_id: int
    project_name: str
    analyzed_at: datetime
    charts_count: int


class ChartDistribution(BaseModel):
    """Schema for chart type distribution."""

    line: int = 0
    bar: int = 0
    pie: int = 0
    scatter: int = 0


class TopInsight(BaseModel):
    """Schema for top insight."""

    file_id: int
    filename: str
    project_name: str
    insight: str
    analyzed_at: datetime


class AnalyticsResponse(BaseModel):
    """Response schema for analytics dashboard."""

    total_projects: int
    total_files: int
    total_analyses: int
    projects_trend: float  # Percentage change from previous period
    files_trend: float
    analyses_trend: float
    recent_analyses: List[RecentAnalysis]
    chart_type_distribution: ChartDistribution
    top_insights: List[TopInsight]


# ===== Phase 10: Advanced Chart Insights =====


class ChartInsightRequest(BaseModel):
    """Request schema for generating advanced chart insight on-demand."""

    file_id: int
    chart_type: Literal["line", "bar", "pie", "scatter"]
    chart_title: str
    chart_data: List[Dict[str, Any]]  # Chart data points
    x_column: Optional[str] = None
    y_column: Optional[str] = None
    category_column: Optional[str] = None
    value_column: Optional[str] = None


class QuickChartInsightRequest(BaseModel):
    """Request schema for generating chart insight in quick analysis (no file_id required)."""

    upload_id: str
    chart_type: Literal["line", "bar", "pie", "scatter"]
    chart_title: str
    chart_data: List[Dict[str, Any]]  # Chart data points
    x_column: Optional[str] = None
    y_column: Optional[str] = None
    category_column: Optional[str] = None
    value_column: Optional[str] = None


class ChartInsightResponse(BaseModel):
    """Response schema for chart insight."""

    insight: str
    insight_type: Literal["basic", "advanced"] = "advanced"
    chart_hash: str  # MD5 hash for caching
    generated_at: datetime
    model_version: str
    cached: bool = False  # Whether this was retrieved from cache/db
