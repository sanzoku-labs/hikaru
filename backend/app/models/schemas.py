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
