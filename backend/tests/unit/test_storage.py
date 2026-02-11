"""Tests for in-memory upload storage."""
import pandas as pd

from app.models.schemas import ColumnInfo, DataSchema
from app.storage import clear_storage, get_upload, store_upload


class TestStorage:
    """Tests for upload storage functions."""

    def setup_method(self):
        """Clear storage before each test."""
        clear_storage()

    def test_store_and_retrieve_upload(self):
        """Test storing and retrieving an upload."""
        df = pd.DataFrame({"a": [1, 2], "b": [3, 4]})
        schema = DataSchema(
            columns=[
                ColumnInfo(
                    name="a", type="numeric", unique_values=2, null_count=0, sample_values=[1, 2]
                ),
                ColumnInfo(
                    name="b", type="numeric", unique_values=2, null_count=0, sample_values=[3, 4]
                ),
            ],
            row_count=2,
            preview=[],
        )
        store_upload("test-id", "file.csv", schema, df)

        result = get_upload("test-id")
        assert result is not None
        assert result["upload_id"] == "test-id"
        assert result["filename"] == "file.csv"
        assert result["schema"] == schema
        assert result["timestamp"] is not None

    def test_get_nonexistent_upload(self):
        """Test retrieving a non-existent upload returns None."""
        assert get_upload("nonexistent") is None

    def test_clear_storage(self):
        """Test clearing all uploads."""
        df = pd.DataFrame({"a": [1]})
        schema = DataSchema(
            columns=[ColumnInfo(name="a", type="numeric", unique_values=1, null_count=0, sample_values=[1])],
            row_count=1,
            preview=[],
        )
        store_upload("id1", "f1.csv", schema, df)
        store_upload("id2", "f2.csv", schema, df)
        clear_storage()

        assert get_upload("id1") is None
        assert get_upload("id2") is None
