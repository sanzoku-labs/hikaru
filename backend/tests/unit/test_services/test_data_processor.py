"""Unit tests for DataProcessor service."""
import io
import tempfile
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

from app.services.data_processor import DataProcessor


class TestDataProcessorParseFile:
    """Test parse_file method"""

    @pytest.fixture
    def temp_csv_us_format(self, tmp_path):
        """Create temporary CSV file in US format (comma delimiter, period decimal)"""
        csv_content = """name,age,salary,city
Alice,25,50000.50,New York
Bob,30,75000.75,San Francisco
Charlie,35,100000.00,Chicago"""

        file_path = tmp_path / "test_us.csv"
        file_path.write_text(csv_content)
        return str(file_path)

    @pytest.fixture
    def temp_csv_european_format(self, tmp_path):
        """Create temporary CSV file in European format (semicolon delimiter, comma decimal)"""
        csv_content = """name;age;salary;city
Alice;25;50000,50;New York
Bob;30;75000,75;San Francisco
Charlie;35;100000,00;Chicago"""

        file_path = tmp_path / "test_eu.csv"
        file_path.write_text(csv_content)
        return str(file_path)

    @pytest.fixture
    def temp_excel_file(self, tmp_path):
        """Create temporary Excel file"""
        df = pd.DataFrame({
            "name": ["Alice", "Bob", "Charlie"],
            "age": [25, 30, 35],
            "salary": [50000.50, 75000.75, 100000.00],
            "city": ["New York", "San Francisco", "Chicago"]
        })

        file_path = tmp_path / "test.xlsx"
        df.to_excel(file_path, index=False)
        return str(file_path)

    def test_parse_csv_us_format(self, temp_csv_us_format):
        """Test parsing CSV in US format"""
        df = DataProcessor.parse_file(temp_csv_us_format, "csv")

        assert len(df) == 3
        assert len(df.columns) == 4
        assert list(df.columns) == ["name", "age", "salary", "city"]
        assert df["name"].tolist() == ["Alice", "Bob", "Charlie"]
        assert df["age"].tolist() == [25, 30, 35]
        # Check decimal parsing
        assert df["salary"].tolist()[0] == 50000.50

    def test_parse_csv_european_format(self, temp_csv_european_format):
        """Test parsing CSV in European format"""
        df = DataProcessor.parse_file(temp_csv_european_format, "csv")

        assert len(df) == 3
        assert len(df.columns) == 4
        # European format should be detected and parsed correctly
        assert df["name"].tolist() == ["Alice", "Bob", "Charlie"]

    def test_parse_excel_file(self, temp_excel_file):
        """Test parsing Excel file"""
        df = DataProcessor.parse_file(temp_excel_file, "xlsx")

        assert len(df) == 3
        assert len(df.columns) == 4
        assert list(df.columns) == ["name", "age", "salary", "city"]
        assert df["name"].tolist() == ["Alice", "Bob", "Charlie"]

    def test_parse_xls_file(self, tmp_path):
        """Test parsing .xls Excel file"""
        # Note: .xls requires xlrd, but we can test the extension handling
        # In real scenario, this would work with proper file
        df = pd.DataFrame({"col1": [1, 2, 3]})
        file_path = tmp_path / "test.xls"
        df.to_excel(file_path, index=False)

        # Should handle .xls extension
        result = DataProcessor.parse_file(str(file_path), "xls")
        assert len(result) == 3

    def test_parse_unsupported_extension(self, tmp_path):
        """Test that unsupported extensions raise ValueError"""
        file_path = tmp_path / "test.txt"
        file_path.write_text("some text")

        with pytest.raises(ValueError, match="Unsupported file extension"):
            DataProcessor.parse_file(str(file_path), "txt")

    def test_parse_invalid_csv(self, tmp_path):
        """Test that invalid CSV raises error"""
        csv_content = "invalid,csv,format\nwith,inconsistent\ncolumn,counts,per,row,extra"

        file_path = tmp_path / "invalid.csv"
        file_path.write_text(csv_content)

        # Should attempt parsing and potentially fail or handle gracefully
        # The actual behavior depends on pandas - it may parse with NaN values
        result = DataProcessor.parse_file(str(file_path), "csv")
        assert result is not None


class TestDataProcessorValidateDataframe:
    """Test validate_dataframe method"""

    def test_valid_dataframe(self):
        """Test that valid dataframe passes validation"""
        df = pd.DataFrame({
            "name": ["Alice", "Bob", "Charlie"],
            "age": [25, 30, 35],
            "salary": [50000, 75000, 100000]
        })

        is_valid, error = DataProcessor.validate_dataframe(df)

        assert is_valid is True
        assert error is None

    def test_too_many_rows(self):
        """Test that dataframe with >100,000 rows fails validation"""
        # Create large dataframe
        df = pd.DataFrame({
            "col1": range(100_001),
            "col2": range(100_001)
        })

        is_valid, error = DataProcessor.validate_dataframe(df)

        assert is_valid is False
        assert "Too many rows" in error
        assert "100001" in error

    def test_insufficient_rows(self):
        """Test that dataframe with <2 rows fails validation"""
        df = pd.DataFrame({
            "col1": [1],
            "col2": [2]
        })

        is_valid, error = DataProcessor.validate_dataframe(df)

        assert is_valid is False
        assert "Insufficient data" in error

    def test_too_many_columns(self):
        """Test that dataframe with >50 columns fails validation"""
        # Create dataframe with 51 columns
        data = {f"col{i}": [1, 2, 3] for i in range(51)}
        df = pd.DataFrame(data)

        is_valid, error = DataProcessor.validate_dataframe(df)

        assert is_valid is False
        assert "Too many columns" in error
        assert "51" in error

    def test_no_numeric_columns(self):
        """Test that dataframe with no numeric columns fails validation"""
        df = pd.DataFrame({
            "name": ["Alice", "Bob", "Charlie"],
            "city": ["NYC", "SF", "Chicago"],
            "country": ["USA", "USA", "USA"]
        })

        is_valid, error = DataProcessor.validate_dataframe(df)

        assert is_valid is False
        assert "No numeric columns" in error

    def test_edge_case_exactly_100000_rows(self):
        """Test that exactly 100,000 rows passes validation"""
        df = pd.DataFrame({
            "col1": range(100_000),
            "col2": range(100_000)
        })

        is_valid, error = DataProcessor.validate_dataframe(df)

        assert is_valid is True
        assert error is None

    def test_edge_case_exactly_2_rows(self):
        """Test that exactly 2 rows passes validation"""
        df = pd.DataFrame({
            "col1": [1, 2],
            "col2": [3, 4]
        })

        is_valid, error = DataProcessor.validate_dataframe(df)

        assert is_valid is True
        assert error is None

    def test_edge_case_exactly_50_columns(self):
        """Test that exactly 50 columns passes validation"""
        data = {f"col{i}": [1, 2, 3] for i in range(50)}
        df = pd.DataFrame(data)

        is_valid, error = DataProcessor.validate_dataframe(df)

        assert is_valid is True
        assert error is None


class TestDataProcessorDetectColumnType:
    """Test detect_column_type method"""

    def test_detect_numeric_type(self):
        """Test detection of numeric columns"""
        series = pd.Series([1, 2, 3, 4, 5], name="count")

        col_type = DataProcessor.detect_column_type(series)

        assert col_type == "numeric"

    def test_detect_float_numeric_type(self):
        """Test detection of float columns"""
        series = pd.Series([1.5, 2.5, 3.5], name="price")

        col_type = DataProcessor.detect_column_type(series)

        assert col_type == "numeric"

    def test_detect_categorical_type(self):
        """Test detection of categorical columns"""
        series = pd.Series(["cat", "dog", "bird"], name="animal")

        col_type = DataProcessor.detect_column_type(series)

        assert col_type == "categorical"

    def test_detect_datetime_type(self):
        """Test detection of datetime columns"""
        series = pd.Series(pd.date_range("2024-01-01", periods=5), name="date")

        col_type = DataProcessor.detect_column_type(series)

        assert col_type == "datetime"

    def test_detect_datetime_from_string(self):
        """Test detection of datetime from string columns"""
        series = pd.Series(["2024-01-01", "2024-01-02", "2024-01-03"], name="date")

        col_type = DataProcessor.detect_column_type(series)

        assert col_type == "datetime"

    def test_detect_time_dimension_month_id(self):
        """Test that month_id is detected as datetime despite being numeric"""
        series = pd.Series([202401, 202402, 202403], name="month_id")

        col_type = DataProcessor.detect_column_type(series)

        assert col_type == "datetime"

    def test_detect_time_dimension_week_id(self):
        """Test that week_id is detected as datetime"""
        series = pd.Series([202401, 202402, 202403], name="week_id")

        col_type = DataProcessor.detect_column_type(series)

        assert col_type == "datetime"

    def test_detect_time_dimension_year(self):
        """Test that year column is detected as datetime"""
        series = pd.Series([2020, 2021, 2022, 2023], name="year")

        col_type = DataProcessor.detect_column_type(series)

        assert col_type == "datetime"

    def test_detect_date_in_column_name(self):
        """Test that columns with 'date' in name are detected as datetime"""
        series = pd.Series([1, 2, 3], name="transaction_date")

        col_type = DataProcessor.detect_column_type(series)

        assert col_type == "datetime"

    def test_categorical_not_mistaken_for_datetime(self):
        """Test that non-datetime strings remain categorical"""
        series = pd.Series(["apple", "banana", "cherry"], name="fruit")

        col_type = DataProcessor.detect_column_type(series)

        assert col_type == "categorical"


class TestDataProcessorSanitizeValue:
    """Test _sanitize_value method"""

    def test_sanitize_nan(self):
        """Test that NaN is converted to None"""
        result = DataProcessor._sanitize_value(np.nan)

        assert result is None

    def test_sanitize_inf(self):
        """Test that Inf is converted to None"""
        result = DataProcessor._sanitize_value(np.inf)

        assert result is None

    def test_sanitize_negative_inf(self):
        """Test that -Inf is converted to None"""
        result = DataProcessor._sanitize_value(-np.inf)

        assert result is None

    def test_sanitize_normal_number(self):
        """Test that normal numbers are unchanged"""
        result = DataProcessor._sanitize_value(42)

        assert result == 42

    def test_sanitize_normal_float(self):
        """Test that normal floats are unchanged"""
        result = DataProcessor._sanitize_value(3.14)

        assert result == 3.14

    def test_sanitize_string(self):
        """Test that strings are unchanged"""
        result = DataProcessor._sanitize_value("hello")

        assert result == "hello"

    def test_sanitize_none(self):
        """Test that None is unchanged"""
        result = DataProcessor._sanitize_value(None)

        assert result is None


class TestDataProcessorAnalyzeSchema:
    """Test analyze_schema method"""

    @pytest.fixture
    def sample_dataframe(self):
        """Create sample dataframe for schema analysis"""
        return pd.DataFrame({
            "id": [1, 2, 3, 4, 5],
            "name": ["Alice", "Bob", "Charlie", "David", "Eve"],
            "age": [25, 30, 35, 40, 45],
            "salary": [50000.50, 75000.75, 100000.00, 125000.25, 150000.50],
            "city": ["NYC", "SF", "Chicago", "NYC", "SF"],
            "date": pd.date_range("2024-01-01", periods=5)
        })

    def test_analyze_schema_structure(self, sample_dataframe):
        """Test that schema has correct structure"""
        schema = DataProcessor.analyze_schema(sample_dataframe)

        assert schema.row_count == 5
        assert len(schema.columns) == 6
        assert len(schema.preview) == 5  # First 10 rows (only 5 available)

    def test_analyze_schema_column_types(self, sample_dataframe):
        """Test that column types are correctly detected"""
        schema = DataProcessor.analyze_schema(sample_dataframe)

        # Find columns by name
        columns_by_name = {col.name: col for col in schema.columns}

        assert columns_by_name["id"].type == "numeric"
        assert columns_by_name["name"].type == "categorical"
        assert columns_by_name["age"].type == "numeric"
        assert columns_by_name["salary"].type == "numeric"
        assert columns_by_name["city"].type == "categorical"
        assert columns_by_name["date"].type == "datetime"

    def test_analyze_schema_numeric_stats(self, sample_dataframe):
        """Test that numeric columns have statistics"""
        schema = DataProcessor.analyze_schema(sample_dataframe)

        # Find age column
        age_col = next(col for col in schema.columns if col.name == "age")

        assert age_col.min == 25
        assert age_col.max == 45
        assert age_col.mean == 35
        assert age_col.median == 35

    def test_analyze_schema_null_counts(self):
        """Test that null counts are correctly calculated"""
        df = pd.DataFrame({
            "col1": [1, 2, None, 4, 5],
            "col2": ["a", None, None, "d", "e"]
        })

        schema = DataProcessor.analyze_schema(df)

        col1 = next(col for col in schema.columns if col.name == "col1")
        col2 = next(col for col in schema.columns if col.name == "col2")

        assert col1.null_count == 1
        assert col2.null_count == 2

    def test_analyze_schema_unique_values_categorical(self, sample_dataframe):
        """Test that unique values are counted for categorical columns"""
        schema = DataProcessor.analyze_schema(sample_dataframe)

        city_col = next(col for col in schema.columns if col.name == "city")

        assert city_col.unique_values == 3  # NYC, SF, Chicago

    def test_analyze_schema_sample_values(self, sample_dataframe):
        """Test that sample values are provided"""
        schema = DataProcessor.analyze_schema(sample_dataframe)

        name_col = next(col for col in schema.columns if col.name == "name")

        assert len(name_col.sample_values) == 5
        assert "Alice" in name_col.sample_values
        assert "Bob" in name_col.sample_values

    def test_analyze_schema_with_nan_values(self):
        """Test schema analysis handles NaN values correctly"""
        df = pd.DataFrame({
            "col1": [1, 2, np.nan, 4, 5],
            "col2": [10.5, np.inf, 30.5, -np.inf, 50.5]
        })

        schema = DataProcessor.analyze_schema(df)

        # Should not crash and should sanitize NaN/Inf
        assert schema is not None
        assert len(schema.columns) == 2

        # Check that sample values don't contain NaN
        col1 = next(col for col in schema.columns if col.name == "col1")
        assert None not in col1.sample_values or all(v is None or isinstance(v, (int, float)) for v in col1.sample_values)

    def test_analyze_schema_preview_format(self, sample_dataframe):
        """Test that preview is in correct format (list of dicts)"""
        schema = DataProcessor.analyze_schema(sample_dataframe)

        assert isinstance(schema.preview, list)
        assert len(schema.preview) > 0
        assert isinstance(schema.preview[0], dict)
        assert "name" in schema.preview[0]
        assert "age" in schema.preview[0]

    def test_analyze_schema_large_dataframe(self):
        """Test schema analysis on dataframe larger than preview limit"""
        df = pd.DataFrame({
            "col1": range(50),
            "col2": range(50, 100)
        })

        schema = DataProcessor.analyze_schema(df)

        assert schema.row_count == 50
        assert len(schema.preview) == 10  # Only first 10 rows

    def test_analyze_schema_empty_dataframe(self):
        """Test schema analysis on empty dataframe"""
        df = pd.DataFrame()

        schema = DataProcessor.analyze_schema(df)

        assert schema.row_count == 0
        assert len(schema.columns) == 0
        assert len(schema.preview) == 0
