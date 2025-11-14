"""
Shared in-memory storage for uploaded files and their metadata.

For MVP, we use a simple dictionary. In production, this would be
replaced with Redis, PostgreSQL, or another persistent storage.
"""

from datetime import datetime
from typing import Any, Dict

import pandas as pd

from app.models.schemas import DataSchema

# In-memory storage: upload_id -> upload data
_upload_storage: Dict[str, Dict[str, Any]] = {}


def store_upload(upload_id: str, filename: str, schema: DataSchema, df: pd.DataFrame) -> None:
    """Store upload metadata and dataframe"""
    _upload_storage[upload_id] = {
        "upload_id": upload_id,
        "filename": filename,
        "schema": schema,
        "dataframe": df,
        "timestamp": datetime.now(),
    }


def get_upload(upload_id: str) -> Dict[str, Any] | None:
    """Retrieve upload data by ID"""
    return _upload_storage.get(upload_id)


def clear_storage() -> None:
    """Clear all stored uploads (useful for testing)"""
    global _upload_storage
    _upload_storage.clear()
