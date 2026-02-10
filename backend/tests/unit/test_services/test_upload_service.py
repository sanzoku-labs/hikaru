"""Tests for UploadService (replaces storage.py global state)."""

from datetime import datetime

import pandas as pd
import pytest
from sqlalchemy.orm import Session

from app.core.exceptions import FileNotFoundError as AppFileNotFoundError
from app.models.database import Upload
from app.models.schemas import ColumnInfo, DataSchema
from app.services.upload_service import UploadService


class TestUploadServiceStore:
    """Tests for storing upload data."""

    def test_store_upload_creates_database_record(self, db_session: Session):
        """Test that store_upload creates a record in the database."""
        service = UploadService(db_session)
        schema = DataSchema(
            row_count=3,
            columns=[
                ColumnInfo(
                    name="id",
                    type="numeric",
                    unique_values=3,
                    null_count=0,
                    sample_values=["1", "2", "3"],
                )
            ],
            preview=[{"id": 1}, {"id": 2}, {"id": 3}],
        )
        df = pd.DataFrame({"id": [1, 2, 3]})

        upload_id = service.store_upload(
            upload_id="test-123", filename="test.csv", schema=schema, df=df
        )

        assert upload_id == "test-123"
        upload = db_session.query(Upload).filter_by(upload_id=upload_id).first()
        assert upload is not None
        assert upload.filename == "test.csv"
        assert upload.schema_json is not None

    def test_store_upload_stores_dataframe_as_csv(self, db_session: Session):
        """Test that store_upload stores the dataframe as CSV."""
        service = UploadService(db_session)
        schema = DataSchema(
            row_count=2,
            columns=[
                ColumnInfo(
                    name="name",
                    type="categorical",
                    unique_values=2,
                    null_count=0,
                    sample_values=["Alice", "Bob"],
                )
            ],
            preview=[{"name": "Alice"}, {"name": "Bob"}],
        )
        df = pd.DataFrame({"name": ["Alice", "Bob"]})

        upload_id = service.store_upload(
            upload_id="test-456", filename="names.csv", schema=schema, df=df
        )

        upload = db_session.query(Upload).filter_by(upload_id=upload_id).first()
        assert upload.data_csv is not None
        assert "Alice" in upload.data_csv
        assert "Bob" in upload.data_csv

    def test_store_upload_serializes_schema_to_json(self, db_session: Session):
        """Test that store_upload serializes the schema to JSON."""
        service = UploadService(db_session)
        schema = DataSchema(
            row_count=1,
            columns=[
                ColumnInfo(
                    name="value",
                    type="numeric",
                    unique_values=1,
                    null_count=0,
                    sample_values=["100"],
                )
            ],
            preview=[{"value": 100}],
        )
        df = pd.DataFrame({"value": [100]})

        upload_id = service.store_upload(
            upload_id="test-789", filename="values.csv", schema=schema, df=df
        )

        upload = db_session.query(Upload).filter_by(upload_id=upload_id).first()
        import json

        schema_dict = json.loads(upload.schema_json)
        assert schema_dict["row_count"] == 1
        assert len(schema_dict["columns"]) == 1
        assert schema_dict["columns"][0]["name"] == "value"


class TestUploadServiceGet:
    """Tests for retrieving upload data."""

    def test_get_upload_returns_data_when_exists(self, db_session: Session):
        """Test that get_upload returns data when upload exists."""
        service = UploadService(db_session)
        schema = DataSchema(
            row_count=2,
            columns=[
                ColumnInfo(
                    name="id",
                    type="numeric",
                    unique_values=2,
                    null_count=0,
                    sample_values=["1", "2"],
                )
            ],
            preview=[{"id": 1}, {"id": 2}],
        )
        df = pd.DataFrame({"id": [1, 2]})

        # Store first
        service.store_upload(upload_id="get-test-1", filename="test.csv", schema=schema, df=df)

        # Retrieve
        result = service.get_upload("get-test-1")

        assert result is not None
        assert result["upload_id"] == "get-test-1"
        assert result["filename"] == "test.csv"
        assert isinstance(result["schema"], DataSchema)
        assert isinstance(result["dataframe"], pd.DataFrame)
        assert isinstance(result["timestamp"], datetime)

    def test_get_upload_raises_exception_when_not_found(self, db_session: Session):
        """Test that get_upload raises FileNotFoundError when upload doesn't exist."""
        service = UploadService(db_session)

        with pytest.raises(AppFileNotFoundError) as exc_info:
            service.get_upload("nonexistent-id")

        assert "Upload ID nonexistent-id not found" in str(exc_info.value.detail)

    def test_get_upload_deserializes_dataframe_correctly(self, db_session: Session):
        """Test that get_upload correctly deserializes the dataframe."""
        service = UploadService(db_session)
        schema = DataSchema(
            row_count=3,
            columns=[
                ColumnInfo(
                    name="name",
                    type="categorical",
                    unique_values=3,
                    null_count=0,
                    sample_values=["Alice", "Bob", "Charlie"],
                ),
                ColumnInfo(
                    name="age",
                    type="numeric",
                    unique_values=3,
                    null_count=0,
                    sample_values=["25", "30", "35"],
                ),
            ],
            preview=[
                {"name": "Alice", "age": 25},
                {"name": "Bob", "age": 30},
                {"name": "Charlie", "age": 35},
            ],
        )
        df = pd.DataFrame({"name": ["Alice", "Bob", "Charlie"], "age": [25, 30, 35]})

        service.store_upload(upload_id="df-test", filename="people.csv", schema=schema, df=df)

        result = service.get_upload("df-test")
        retrieved_df = result["dataframe"]

        assert len(retrieved_df) == 3
        assert list(retrieved_df.columns) == ["name", "age"]
        assert retrieved_df["name"].tolist() == ["Alice", "Bob", "Charlie"]
        assert retrieved_df["age"].tolist() == [25, 30, 35]


class TestUploadServiceClear:
    """Tests for clearing upload data."""

    def test_clear_storage_removes_all_uploads(self, db_session: Session):
        """Test that clear_storage removes all uploads from database."""
        service = UploadService(db_session)
        schema = DataSchema(
            row_count=1,
            columns=[
                ColumnInfo(
                    name="id",
                    type="numeric",
                    unique_values=1,
                    null_count=0,
                    sample_values=["1"],
                )
            ],
            preview=[{"id": 1}],
        )
        df = pd.DataFrame({"id": [1]})

        # Store multiple uploads
        service.store_upload(upload_id="clear-1", filename="a.csv", schema=schema, df=df)
        service.store_upload(upload_id="clear-2", filename="b.csv", schema=schema, df=df)
        service.store_upload(upload_id="clear-3", filename="c.csv", schema=schema, df=df)

        assert db_session.query(Upload).count() == 3

        # Clear all
        service.clear_storage()

        assert db_session.query(Upload).count() == 0

    def test_clear_storage_on_empty_database(self, db_session: Session):
        """Test that clear_storage works even when database is empty."""
        service = UploadService(db_session)

        # Should not raise any errors
        service.clear_storage()

        assert db_session.query(Upload).count() == 0
