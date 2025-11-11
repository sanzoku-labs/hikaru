from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import List, Dict, Any, Optional, Literal
from datetime import datetime


# ===== Phase 8: Authentication Schemas =====

class UserRegister(BaseModel):
    """Request schema for user registration."""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50, pattern="^[a-zA-Z0-9_-]+$")
    password: str = Field(..., min_length=8, max_length=72)  # Bcrypt limit
    full_name: Optional[str] = Field(None, max_length=255)

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        """Ensure password meets strength requirements"""
        # Check byte length (bcrypt limit is 72 bytes)
        if len(v.encode('utf-8')) > 72:
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

    class Config:
        from_attributes = True  # Pydantic v2 (previously orm_mode = True)


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
    schema: DataSchema
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

class AnalyzeResponse(BaseModel):
    upload_id: str
    filename: str
    schema: DataSchema
    charts: List[ChartData]
    upload_timestamp: datetime
    global_summary: Optional[str] = None  # Phase 3: Overall AI summary

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
