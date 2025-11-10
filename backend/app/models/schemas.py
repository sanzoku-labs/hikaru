from pydantic import BaseModel
from typing import List, Dict, Any, Optional, Literal
from datetime import datetime

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
