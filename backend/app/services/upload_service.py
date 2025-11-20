"""Upload service - replaces global storage.py with database-backed storage."""

import json
import logging
from datetime import datetime, timezone
from io import StringIO
from typing import Any, Dict

import pandas as pd
from sqlalchemy.orm import Session

from app.core.exceptions import FileNotFoundError as AppFileNotFoundError
from app.models.database import Upload
from app.models.schemas import DataSchema

logger = logging.getLogger(__name__)


class UploadService:
    """Service for managing uploaded file data in the database."""

    def __init__(self, db: Session):
        """Initialize the upload service with a database session."""
        self.db = db

    def store_upload(
        self, upload_id: str, filename: str, schema: DataSchema, df: pd.DataFrame,
        user_id: int = None
    ) -> str:
        """
        Store upload metadata and dataframe in the database.

        Args:
            upload_id: Unique identifier for the upload
            filename: Original filename
            schema: DataSchema object with column metadata
            df: Pandas DataFrame with the uploaded data
            user_id: Optional user ID who owns this upload

        Returns:
            The upload_id
        """
        # Serialize dataframe to CSV string
        csv_buffer = StringIO()
        df.to_csv(csv_buffer, index=False)
        data_csv = csv_buffer.getvalue()

        # Serialize schema to JSON
        schema_json = schema.model_dump_json()

        # Create Upload record
        upload = Upload(
            upload_id=upload_id,
            filename=filename,
            schema_json=schema_json,
            data_csv=data_csv,
            upload_date=datetime.now(timezone.utc),
            user_id=user_id,
        )

        self.db.add(upload)
        self.db.commit()
        self.db.refresh(upload)

        logger.info(
            f"Stored upload {upload_id} with {len(df)} rows", extra={"upload_id": upload_id}
        )

        return upload_id

    def get_upload(self, upload_id: str) -> Dict[str, Any]:
        """
        Retrieve upload data by ID.

        Args:
            upload_id: The upload identifier

        Returns:
            Dictionary containing:
                - upload_id: str
                - filename: str
                - schema: DataSchema
                - dataframe: pd.DataFrame
                - timestamp: datetime

        Raises:
            AppFileNotFoundError: If upload_id does not exist
        """
        upload = self.db.query(Upload).filter_by(upload_id=upload_id).first()

        if not upload:
            raise AppFileNotFoundError(f"Upload ID {upload_id} not found")

        # Deserialize schema from JSON
        schema = DataSchema.model_validate_json(upload.schema_json)

        # Deserialize dataframe from CSV
        csv_buffer = StringIO(upload.data_csv)
        df = pd.read_csv(csv_buffer)

        return {
            "upload_id": upload.upload_id,
            "filename": upload.filename,
            "schema": schema,
            "dataframe": df,
            "timestamp": upload.upload_date,
        }

    def clear_storage(self) -> None:
        """
        Clear all stored uploads (useful for testing).

        This deletes all Upload records from the database.
        """
        self.db.query(Upload).delete()
        self.db.commit()

        logger.info("Cleared all upload storage")
