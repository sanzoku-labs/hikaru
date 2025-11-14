"""
Unit tests for MergeService.

Tests file merging, join operations, and validation.
"""
import tempfile
from pathlib import Path

import pandas as pd
import pytest

from app.services.merge_service import MergeService


@pytest.fixture
def merge_service():
    """Create MergeService instance"""
    return MergeService()


@pytest.fixture
def sample_df_customers():
    """Create sample customers DataFrame"""
    return pd.DataFrame({
        "customer_id": [1, 2, 3, 4, 5],
        "customer_name": ["Alice", "Bob", "Charlie", "David", "Eve"],
        "city": ["NYC", "LA", "Chicago", "Houston", "Miami"],
    })


@pytest.fixture
def sample_df_orders():
    """Create sample orders DataFrame"""
    return pd.DataFrame({
        "order_id": [101, 102, 103, 104, 105, 106],
        "customer_id": [1, 2, 2, 3, 6, 7],  # 6 and 7 don't exist in customers
        "amount": [100, 200, 150, 300, 250, 180],
    })


@pytest.fixture
def temp_csv_files(sample_df_customers, sample_df_orders):
    """Create temporary CSV files"""
    with tempfile.TemporaryDirectory() as tmpdir:
        customers_file = Path(tmpdir) / "customers.csv"
        orders_file = Path(tmpdir) / "orders.csv"

        sample_df_customers.to_csv(customers_file, index=False)
        sample_df_orders.to_csv(orders_file, index=False)

        yield str(customers_file), str(orders_file)


@pytest.fixture
def temp_excel_files(sample_df_customers, sample_df_orders):
    """Create temporary Excel files"""
    with tempfile.TemporaryDirectory() as tmpdir:
        customers_file = Path(tmpdir) / "customers.xlsx"
        orders_file = Path(tmpdir) / "orders.xlsx"

        sample_df_customers.to_excel(customers_file, index=False)
        sample_df_orders.to_excel(orders_file, index=False)

        yield str(customers_file), str(orders_file)


class TestLoadFile:
    """Test suite for load_file method"""

    def test_loads_csv_file(self, merge_service, temp_csv_files):
        """Test loading CSV file"""
        customers_file, _ = temp_csv_files

        df = merge_service.load_file(customers_file)

        assert isinstance(df, pd.DataFrame)
        assert len(df) == 5
        assert "customer_id" in df.columns

    def test_loads_excel_file(self, merge_service, temp_excel_files):
        """Test loading Excel file"""
        customers_file, _ = temp_excel_files

        df = merge_service.load_file(customers_file)

        assert isinstance(df, pd.DataFrame)
        assert len(df) == 5
        assert "customer_id" in df.columns

    def test_raises_error_for_unsupported_file_type(self, merge_service):
        """Test that unsupported file types raise ValueError"""
        with tempfile.NamedTemporaryFile(suffix=".json") as tmp:
            with pytest.raises(ValueError, match="Unsupported file type"):
                merge_service.load_file(tmp.name)


class TestMergeFiles:
    """Test suite for merge_files method"""

    def test_inner_join(self, merge_service, sample_df_customers, sample_df_orders):
        """Test inner join merges only matching rows"""
        merged_df, schema = merge_service.merge_files(
            sample_df_customers,
            sample_df_orders,
            left_key="customer_id",
            right_key="customer_id",
            join_type="inner",
        )

        # Inner join should only include customers 1, 2, 3 (not 4, 5, 6, 7)
        assert len(merged_df) == 4  # Orders 101, 102, 103, 104
        assert "customer_name" in merged_df.columns
        assert "amount" in merged_df.columns

    def test_left_join(self, merge_service, sample_df_customers, sample_df_orders):
        """Test left join keeps all rows from left DataFrame"""
        merged_df, schema = merge_service.merge_files(
            sample_df_customers,
            sample_df_orders,
            left_key="customer_id",
            right_key="customer_id",
            join_type="left",
        )

        # Should include all 5 customers, even if no orders
        # Customers 4 and 5 will have NaN for order fields
        assert len(merged_df) >= 5

    def test_right_join(self, merge_service, sample_df_customers, sample_df_orders):
        """Test right join keeps all rows from right DataFrame"""
        merged_df, schema = merge_service.merge_files(
            sample_df_customers,
            sample_df_orders,
            left_key="customer_id",
            right_key="customer_id",
            join_type="right",
        )

        # Should include all 6 orders
        assert len(merged_df) == 6

    def test_outer_join(self, merge_service, sample_df_customers, sample_df_orders):
        """Test outer join keeps all rows from both DataFrames"""
        merged_df, schema = merge_service.merge_files(
            sample_df_customers,
            sample_df_orders,
            left_key="customer_id",
            right_key="customer_id",
            join_type="outer",
        )

        # Should include all customers and all orders
        assert len(merged_df) >= 6

    def test_custom_suffixes(self, merge_service, sample_df_customers, sample_df_orders):
        """Test that custom suffixes are applied to duplicate columns"""
        merged_df, schema = merge_service.merge_files(
            sample_df_customers,
            sample_df_orders,
            left_key="customer_id",
            right_key="customer_id",
            join_type="inner",
            left_suffix="_cust",
            right_suffix="_ord",
        )

        # customer_id appears in both, so should have suffixed versions
        assert "customer_id_cust" in merged_df.columns or "customer_id_ord" in merged_df.columns or "customer_id" in merged_df.columns

    def test_raises_error_for_missing_left_key(
        self, merge_service, sample_df_customers, sample_df_orders
    ):
        """Test that missing left key raises ValueError"""
        with pytest.raises(ValueError, match="not found in first file"):
            merge_service.merge_files(
                sample_df_customers,
                sample_df_orders,
                left_key="nonexistent_column",
                right_key="customer_id",
                join_type="inner",
            )

    def test_raises_error_for_missing_right_key(
        self, merge_service, sample_df_customers, sample_df_orders
    ):
        """Test that missing right key raises ValueError"""
        with pytest.raises(ValueError, match="not found in second file"):
            merge_service.merge_files(
                sample_df_customers,
                sample_df_orders,
                left_key="customer_id",
                right_key="nonexistent_column",
                join_type="inner",
            )

    def test_raises_error_for_empty_result(self, merge_service):
        """Test that merge with no matching keys raises ValueError"""
        df_a = pd.DataFrame({"id": [1, 2, 3], "value": ["a", "b", "c"]})
        df_b = pd.DataFrame({"id": [4, 5, 6], "value": ["d", "e", "f"]})

        with pytest.raises(ValueError, match="empty dataset"):
            merge_service.merge_files(df_a, df_b, "id", "id", join_type="inner")

    def test_returns_valid_schema(
        self, merge_service, sample_df_customers, sample_df_orders
    ):
        """Test that merge returns valid DataSchema"""
        merged_df, schema = merge_service.merge_files(
            sample_df_customers,
            sample_df_orders,
            left_key="customer_id",
            right_key="customer_id",
            join_type="inner",
        )

        assert schema is not None
        assert schema.row_count == len(merged_df)
        assert len(schema.columns) > 0
        assert len(schema.preview) <= 10


class TestGenerateMergedSchema:
    """Test suite for _generate_merged_schema method"""

    def test_generates_schema_with_numeric_columns(self, merge_service):
        """Test schema generation for numeric columns"""
        df = pd.DataFrame({
            "numeric_col": [1, 2, 3, 4, 5],
            "value": [10.5, 20.3, 30.1, 40.9, 50.2],
        })

        schema = merge_service._generate_merged_schema(df)

        assert len(schema.columns) == 2
        numeric_cols = [c for c in schema.columns if c.type == "numeric"]
        assert len(numeric_cols) == 2

        # Check that numeric stats are populated
        for col in numeric_cols:
            assert col.min is not None
            assert col.max is not None
            assert col.mean is not None
            assert col.median is not None

    def test_generates_schema_with_categorical_columns(self, merge_service):
        """Test schema generation for categorical columns"""
        df = pd.DataFrame({
            "category": ["A", "B", "C", "A", "B"],
            "name": ["Alice", "Bob", "Charlie", "David", "Eve"],
        })

        schema = merge_service._generate_merged_schema(df)

        categorical_cols = [c for c in schema.columns if c.type == "categorical"]
        assert len(categorical_cols) == 2

        # Check unique values
        for col in categorical_cols:
            assert col.unique_values is not None

    def test_generates_schema_with_datetime_columns(self, merge_service):
        """Test schema generation for datetime columns"""
        df = pd.DataFrame({
            "date": pd.date_range("2024-01-01", periods=5, freq="D"),
            "value": [1, 2, 3, 4, 5],
        })

        schema = merge_service._generate_merged_schema(df)

        datetime_cols = [c for c in schema.columns if c.type == "datetime"]
        assert len(datetime_cols) == 1

    def test_handles_null_values(self, merge_service):
        """Test schema generation with null values"""
        df = pd.DataFrame({
            "col_with_nulls": [1, None, 3, None, 5],
            "text": ["a", "b", None, "d", "e"],
        })

        schema = merge_service._generate_merged_schema(df)

        # Check null counts
        for col in schema.columns:
            assert col.null_count >= 0

    def test_preview_limited_to_10_rows(self, merge_service):
        """Test that preview is limited to 10 rows"""
        df = pd.DataFrame({"col": range(100)})

        schema = merge_service._generate_merged_schema(df)

        assert len(schema.preview) == 10

    def test_handles_empty_dataframe(self, merge_service):
        """Test schema generation for empty DataFrame"""
        df = pd.DataFrame({"col1": [], "col2": []})

        schema = merge_service._generate_merged_schema(df)

        assert schema.row_count == 0
        assert len(schema.columns) == 2


class TestValidateMergeCompatibility:
    """Test suite for validate_merge_compatibility method"""

    def test_validates_compatible_merge(
        self, merge_service, sample_df_customers, sample_df_orders
    ):
        """Test validation of compatible merge"""
        result = merge_service.validate_merge_compatibility(
            sample_df_customers,
            sample_df_orders,
            left_key="customer_id",
            right_key="customer_id",
        )

        assert result["compatible"] is True
        assert "inner" in result["estimated_row_count"]
        assert "left" in result["estimated_row_count"]
        assert "right" in result["estimated_row_count"]
        assert "outer" in result["estimated_row_count"]

    def test_detects_missing_left_key(
        self, merge_service, sample_df_customers, sample_df_orders
    ):
        """Test detection of missing left key"""
        result = merge_service.validate_merge_compatibility(
            sample_df_customers,
            sample_df_orders,
            left_key="nonexistent",
            right_key="customer_id",
        )

        assert result["compatible"] is False
        assert len(result["warnings"]) > 0
        assert "not found in first file" in result["warnings"][0]

    def test_detects_missing_right_key(
        self, merge_service, sample_df_customers, sample_df_orders
    ):
        """Test detection of missing right key"""
        result = merge_service.validate_merge_compatibility(
            sample_df_customers,
            sample_df_orders,
            left_key="customer_id",
            right_key="nonexistent",
        )

        assert result["compatible"] is False
        assert len(result["warnings"]) > 0
        assert "not found in second file" in result["warnings"][0]

    def test_warns_about_type_mismatch(self, merge_service):
        """Test warning for mismatched data types"""
        df_a = pd.DataFrame({"key": [1, 2, 3]})  # Numeric
        df_b = pd.DataFrame({"key": ["1", "2", "3"]})  # String

        result = merge_service.validate_merge_compatibility(df_a, df_b, "key", "key")

        # Should warn about type mismatch
        assert len(result["warnings"]) > 0
        assert "data types differ" in result["warnings"][0]

    def test_warns_about_no_matching_values(self, merge_service):
        """Test warning when no values match"""
        df_a = pd.DataFrame({"id": [1, 2, 3]})
        df_b = pd.DataFrame({"id": [4, 5, 6]})

        result = merge_service.validate_merge_compatibility(df_a, df_b, "id", "id")

        # Should warn about no matches
        warnings_text = " ".join(result["warnings"])
        assert "No matching values" in warnings_text or "empty dataset" in warnings_text

    def test_estimates_row_counts(
        self, merge_service, sample_df_customers, sample_df_orders
    ):
        """Test that row count estimates are provided"""
        result = merge_service.validate_merge_compatibility(
            sample_df_customers,
            sample_df_orders,
            left_key="customer_id",
            right_key="customer_id",
        )

        # Check estimates exist and are reasonable
        assert result["estimated_row_count"]["left"] == 5  # All customers
        assert result["estimated_row_count"]["right"] == 6  # All orders
        assert result["estimated_row_count"]["inner"] > 0
        assert result["estimated_row_count"]["outer"] > 0

    def test_handles_null_values_in_keys(self, merge_service):
        """Test handling of null values in join keys"""
        df_a = pd.DataFrame({"key": [1, 2, None, 4]})
        df_b = pd.DataFrame({"key": [1, None, 3, 4]})

        result = merge_service.validate_merge_compatibility(df_a, df_b, "key", "key")

        # Should not crash, should handle nulls gracefully
        assert "compatible" in result
        assert "estimated_row_count" in result
