"""
Merge service for Phase 7C - File Merging.

Handles merging two files using SQL-like joins (inner, left, right, outer).
"""
from pathlib import Path
from typing import Tuple

import pandas as pd

from app.models.schemas import ColumnInfo, DataSchema
from app.services.data_processor import DataProcessor


class MergeService:
    """Service for merging two datasets."""

    def __init__(self):
        self.data_processor = DataProcessor()

    def load_file(self, file_path: str) -> pd.DataFrame:
        """
        Load a file into a pandas DataFrame.

        Args:
            file_path: Path to CSV or XLSX file

        Returns:
            DataFrame containing the file data
        """
        file_path = Path(file_path)

        if file_path.suffix == ".csv":
            return pd.read_csv(file_path)
        elif file_path.suffix == ".xlsx":
            return pd.read_excel(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_path.suffix}")

    def merge_files(
        self,
        df_a: pd.DataFrame,
        df_b: pd.DataFrame,
        left_key: str,
        right_key: str,
        join_type: str = "inner",
        left_suffix: str = "_a",
        right_suffix: str = "_b",
    ) -> Tuple[pd.DataFrame, DataSchema]:
        """
        Merge two DataFrames.

        Args:
            df_a: First DataFrame
            df_b: Second DataFrame
            left_key: Column name in df_a to join on
            right_key: Column name in df_b to join on
            join_type: Type of join (inner, left, right, outer)
            left_suffix: Suffix for duplicate columns from df_a
            right_suffix: Suffix for duplicate columns from df_b

        Returns:
            Tuple of (merged DataFrame, DataSchema for merged data)

        Raises:
            ValueError: If join keys don't exist or join fails
        """
        # Validate join keys exist
        if left_key not in df_a.columns:
            raise ValueError(f"Column '{left_key}' not found in first file")
        if right_key not in df_b.columns:
            raise ValueError(f"Column '{right_key}' not found in second file")

        # Perform merge
        try:
            merged_df = pd.merge(
                df_a,
                df_b,
                left_on=left_key,
                right_on=right_key,
                how=join_type,
                suffixes=(left_suffix, right_suffix),
            )

            if len(merged_df) == 0:
                raise ValueError("Merge resulted in empty dataset. No matching keys found.")

            # Generate schema for merged data
            schema = self._generate_merged_schema(merged_df)

            return merged_df, schema

        except Exception as e:
            raise ValueError(f"Failed to merge files: {str(e)}")

    def _generate_merged_schema(self, df: pd.DataFrame) -> DataSchema:
        """
        Generate schema for merged DataFrame.

        Args:
            df: Merged DataFrame

        Returns:
            DataSchema object
        """
        columns = []

        for col_name in df.columns:
            col_data = df[col_name]

            # Detect column type
            if pd.api.types.is_numeric_dtype(col_data):
                col_type = "numeric"
                null_count = int(col_data.isnull().sum())
                min_val = float(col_data.min()) if not col_data.empty else None
                max_val = float(col_data.max()) if not col_data.empty else None
                mean_val = float(col_data.mean()) if not col_data.empty else None
                median_val = float(col_data.median()) if not col_data.empty else None

                column_info = ColumnInfo(
                    name=col_name,
                    type=col_type,
                    null_count=null_count,
                    sample_values=col_data.dropna().head(5).tolist(),
                    min=min_val,
                    max=max_val,
                    mean=mean_val,
                    median=median_val,
                )

            elif pd.api.types.is_datetime64_any_dtype(col_data):
                col_type = "datetime"
                null_count = int(col_data.isnull().sum())

                column_info = ColumnInfo(
                    name=col_name,
                    type=col_type,
                    null_count=null_count,
                    sample_values=col_data.dropna().astype(str).head(5).tolist(),
                )

            else:
                col_type = "categorical"
                null_count = int(col_data.isnull().sum())
                unique_values = int(col_data.nunique())

                column_info = ColumnInfo(
                    name=col_name,
                    type=col_type,
                    null_count=null_count,
                    unique_values=unique_values,
                    sample_values=col_data.dropna().head(5).tolist(),
                )

            columns.append(column_info)

        # Get preview (first 10 rows)
        preview = df.head(10).fillna("").to_dict("records")

        return DataSchema(columns=columns, row_count=len(df), preview=preview)

    def validate_merge_compatibility(
        self, df_a: pd.DataFrame, df_b: pd.DataFrame, left_key: str, right_key: str
    ) -> dict:
        """
        Validate if two files can be merged on given keys.

        Args:
            df_a: First DataFrame
            df_b: Second DataFrame
            left_key: Column in df_a
            right_key: Column in df_b

        Returns:
            Dictionary with compatibility info
        """
        result = {
            "compatible": True,
            "warnings": [],
            "estimated_row_count": {"inner": 0, "left": len(df_a), "right": len(df_b), "outer": 0},
        }

        # Check if keys exist
        if left_key not in df_a.columns:
            result["compatible"] = False
            result["warnings"].append(f"Column '{left_key}' not found in first file")
            return result

        if right_key not in df_b.columns:
            result["compatible"] = False
            result["warnings"].append(f"Column '{right_key}' not found in second file")
            return result

        # Check data types compatibility
        dtype_a = df_a[left_key].dtype
        dtype_b = df_b[right_key].dtype

        if dtype_a != dtype_b:
            result["warnings"].append(
                f"Join key data types differ: {dtype_a} vs {dtype_b}. "
                "This may cause unexpected results."
            )

        # Estimate row counts for different join types
        unique_a = set(df_a[left_key].dropna())
        unique_b = set(df_b[right_key].dropna())

        matching_keys = len(unique_a & unique_b)

        if matching_keys == 0:
            result["warnings"].append(
                "No matching values found between join keys. "
                "Inner join will result in empty dataset."
            )

        # Rough estimates (actual counts may vary)
        result["estimated_row_count"]["inner"] = max(
            1, int(len(df_a) * matching_keys / max(len(unique_a), 1))
        )
        result["estimated_row_count"]["outer"] = (
            len(df_a) + len(df_b) - result["estimated_row_count"]["inner"]
        )

        return result
