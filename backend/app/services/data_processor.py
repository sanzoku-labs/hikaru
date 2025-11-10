import pandas as pd
import numpy as np
from typing import Tuple, Optional
from app.models.schemas import DataSchema, ColumnInfo

class DataProcessor:
    @staticmethod
    def parse_file(file_path: str, file_extension: str) -> pd.DataFrame:
        """Parse CSV or Excel file into DataFrame"""
        if file_extension == 'csv':
            return pd.read_csv(file_path, encoding='utf-8')
        elif file_extension in ['xlsx', 'xls']:
            return pd.read_excel(file_path)
        else:
            raise ValueError(f"Unsupported file extension: {file_extension}")

    @staticmethod
    def validate_dataframe(df: pd.DataFrame) -> Tuple[bool, Optional[str]]:
        """Validate dataframe meets requirements"""
        # Row count check
        if len(df) > 100_000:
            return False, f"Too many rows: {len(df)} (limit: 100,000)"

        if len(df) < 2:
            return False, "Insufficient data (minimum: 2 rows)"

        # Column count check
        if len(df.columns) > 50:
            return False, f"Too many columns: {len(df.columns)} (limit: 50)"

        # Check for at least one numeric column
        numeric_cols = df.select_dtypes(include=['number']).columns
        if len(numeric_cols) == 0:
            return False, "No numeric columns found for visualization"

        return True, None

    @staticmethod
    def detect_column_type(series: pd.Series) -> str:
        """Detect column type: numeric, categorical, or datetime"""
        # Check for datetime
        if pd.api.types.is_datetime64_any_dtype(series):
            return "datetime"

        # Try to convert to datetime
        if series.dtype == 'object':
            try:
                pd.to_datetime(series.dropna().head(100))
                return "datetime"
            except:
                pass

        # Check for numeric
        if pd.api.types.is_numeric_dtype(series):
            return "numeric"

        # Default to categorical
        return "categorical"

    @staticmethod
    def analyze_schema(df: pd.DataFrame) -> DataSchema:
        """Analyze dataframe and generate schema"""
        columns_info = []

        for col in df.columns:
            series = df[col]
            col_type = DataProcessor.detect_column_type(series)

            col_info = ColumnInfo(
                name=col,
                type=col_type,
                null_count=int(series.isnull().sum()),
                unique_values=int(series.nunique()) if col_type == "categorical" else None,
                sample_values=series.dropna().head(5).tolist()
            )

            # Add numeric stats
            if col_type == "numeric":
                col_info.min = float(series.min())
                col_info.max = float(series.max())
                col_info.mean = float(series.mean())
                col_info.median = float(series.median())

            columns_info.append(col_info)

        # Get preview (first 10 rows)
        preview = df.head(10).replace({np.nan: None}).to_dict('records')

        return DataSchema(
            columns=columns_info,
            row_count=len(df),
            preview=preview
        )
