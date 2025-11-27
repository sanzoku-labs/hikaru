"""Test validation logic in DataProcessor for multi-sheet Excel files."""
import pandas as pd
import pytest

from app.services.data_processor import DataProcessor


class TestDataProcessorValidation:
    """Test DataFrame validation for different data scenarios."""

    def test_validate_insufficient_rows(self):
        """Test validation fails with < 2 rows."""
        df = pd.DataFrame({"col1": [1]})
        is_valid, error_msg = DataProcessor.validate_dataframe(df)

        assert is_valid is False
        assert error_msg == "Insufficient data (minimum: 2 rows)"

    def test_validate_no_numeric_columns(self):
        """Test validation fails when no numeric columns exist."""
        df = pd.DataFrame(
            {
                "name": ["Alice", "Bob", "Charlie"],
                "category": ["A", "B", "C"],
            }
        )
        is_valid, error_msg = DataProcessor.validate_dataframe(df)

        assert is_valid is False
        assert error_msg == "No numeric columns found for visualization"

    def test_validate_success_with_numeric_columns(self):
        """Test validation succeeds with numeric columns and enough rows."""
        df = pd.DataFrame(
            {
                "month": ["Jan", "Feb", "Mar"],
                "sales": [100, 200, 150],
                "profit": [20, 40, 30],
            }
        )
        is_valid, error_msg = DataProcessor.validate_dataframe(df)

        assert is_valid is True
        assert error_msg is None

    def test_validate_too_many_rows(self):
        """Test validation fails with > 100,000 rows."""
        # Create a DataFrame with 100,001 rows
        large_df = pd.DataFrame({"col1": range(100_001)})
        is_valid, error_msg = DataProcessor.validate_dataframe(large_df)

        assert is_valid is False
        assert "Too many rows" in error_msg
        assert "100,000" in error_msg

    def test_validate_too_many_columns(self):
        """Test validation fails with > 50 columns."""
        # Create a DataFrame with 51 columns
        data = {f"col{i}": [1, 2, 3] for i in range(51)}
        wide_df = pd.DataFrame(data)
        is_valid, error_msg = DataProcessor.validate_dataframe(wide_df)

        assert is_valid is False
        assert "Too many columns" in error_msg
        assert "50" in error_msg

    def test_validate_minimum_valid_case(self):
        """Test validation succeeds with exactly 2 rows and 1 numeric column."""
        df = pd.DataFrame({"value": [1, 2]})
        is_valid, error_msg = DataProcessor.validate_dataframe(df)

        assert is_valid is True
        assert error_msg is None
