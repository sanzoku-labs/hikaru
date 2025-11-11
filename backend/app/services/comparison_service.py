"""
Comparison service for Phase 7B - File Comparison.

Handles comparing two files side-by-side, generating overlay charts,
and calculating difference metrics.
"""
import pandas as pd
import json
from typing import List, Dict, Any, Tuple
from pathlib import Path
from app.models.schemas import OverlayChartData, DataSchema


class ComparisonService:
    """Service for comparing two datasets."""

    def load_file(self, file_path: str) -> pd.DataFrame:
        """
        Load a file into a pandas DataFrame.

        Args:
            file_path: Path to CSV or XLSX file

        Returns:
            DataFrame containing the file data
        """
        file_path = Path(file_path)

        if file_path.suffix == '.csv':
            return pd.read_csv(file_path)
        elif file_path.suffix == '.xlsx':
            return pd.read_excel(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_path.suffix}")

    def find_common_columns(
        self,
        df_a: pd.DataFrame,
        df_b: pd.DataFrame
    ) -> Tuple[List[str], List[str], List[str]]:
        """
        Find common columns between two DataFrames.

        Args:
            df_a: First DataFrame
            df_b: Second DataFrame

        Returns:
            Tuple of (common_numeric, common_categorical, common_datetime)
        """
        common_cols = set(df_a.columns) & set(df_b.columns)

        common_numeric = []
        common_categorical = []
        common_datetime = []

        for col in common_cols:
            # Check if numeric in both
            if pd.api.types.is_numeric_dtype(df_a[col]) and pd.api.types.is_numeric_dtype(df_b[col]):
                common_numeric.append(col)
            # Check if datetime in both
            elif pd.api.types.is_datetime64_any_dtype(df_a[col]) or pd.api.types.is_datetime64_any_dtype(df_b[col]):
                common_datetime.append(col)
            else:
                common_categorical.append(col)

        return common_numeric, common_categorical, common_datetime

    def generate_overlay_charts(
        self,
        df_a: pd.DataFrame,
        df_b: pd.DataFrame,
        file_a_name: str,
        file_b_name: str,
        comparison_type: str = "side_by_side"
    ) -> List[OverlayChartData]:
        """
        Generate overlay charts comparing two datasets.

        Args:
            df_a: First DataFrame
            df_b: Second DataFrame
            file_a_name: Name of first file
            file_b_name: Name of second file
            comparison_type: Type of comparison (trend, yoy, side_by_side)

        Returns:
            List of OverlayChartData objects
        """
        charts = []
        numeric_cols, categorical_cols, datetime_cols = self.find_common_columns(df_a, df_b)

        # Priority 1: Time series comparison (datetime + numeric)
        if datetime_cols and numeric_cols:
            for datetime_col in datetime_cols[:1]:  # Use first datetime column
                for numeric_col in numeric_cols[:2]:  # Use first 2 numeric columns
                    chart = self._create_time_series_overlay(
                        df_a, df_b, datetime_col, numeric_col,
                        file_a_name, file_b_name
                    )
                    if chart:
                        charts.append(chart)

        # Priority 2: Categorical comparison (categorical + numeric)
        if categorical_cols and numeric_cols and len(charts) < 3:
            for cat_col in categorical_cols[:1]:
                for num_col in numeric_cols[:2]:
                    if len(charts) >= 3:
                        break
                    chart = self._create_categorical_overlay(
                        df_a, df_b, cat_col, num_col,
                        file_a_name, file_b_name
                    )
                    if chart:
                        charts.append(chart)

        # Priority 3: Numeric scatter comparison
        if len(numeric_cols) >= 2 and len(charts) < 3:
            chart = self._create_scatter_overlay(
                df_a, df_b, numeric_cols[0], numeric_cols[1],
                file_a_name, file_b_name
            )
            if chart:
                charts.append(chart)

        return charts[:4]  # Limit to 4 charts

    def _create_time_series_overlay(
        self,
        df_a: pd.DataFrame,
        df_b: pd.DataFrame,
        datetime_col: str,
        numeric_col: str,
        file_a_name: str,
        file_b_name: str
    ) -> OverlayChartData:
        """Create overlay line chart for time series data."""
        try:
            # Prepare data for file A
            df_a_sorted = df_a[[datetime_col, numeric_col]].copy()
            df_a_sorted[datetime_col] = pd.to_datetime(df_a_sorted[datetime_col], errors='coerce')
            df_a_sorted = df_a_sorted.dropna()
            df_a_sorted = df_a_sorted.sort_values(datetime_col)
            df_a_sorted = df_a_sorted.groupby(datetime_col)[numeric_col].mean().reset_index()

            # Prepare data for file B
            df_b_sorted = df_b[[datetime_col, numeric_col]].copy()
            df_b_sorted[datetime_col] = pd.to_datetime(df_b_sorted[datetime_col], errors='coerce')
            df_b_sorted = df_b_sorted.dropna()
            df_b_sorted = df_b_sorted.sort_values(datetime_col)
            df_b_sorted = df_b_sorted.groupby(datetime_col)[numeric_col].mean().reset_index()

            if len(df_a_sorted) == 0 or len(df_b_sorted) == 0:
                return None

            return OverlayChartData(
                chart_type="line",
                title=f"{numeric_col} over {datetime_col}",
                file_a_name=file_a_name,
                file_b_name=file_b_name,
                x_column=datetime_col,
                y_column=numeric_col,
                file_a_data=df_a_sorted.to_dict('records'),
                file_b_data=df_b_sorted.to_dict('records')
            )

        except Exception:
            return None

    def _create_categorical_overlay(
        self,
        df_a: pd.DataFrame,
        df_b: pd.DataFrame,
        cat_col: str,
        num_col: str,
        file_a_name: str,
        file_b_name: str
    ) -> OverlayChartData:
        """Create overlay bar chart for categorical data."""
        try:
            # Aggregate data for file A
            df_a_agg = df_a.groupby(cat_col)[num_col].sum().reset_index()
            df_a_agg = df_a_agg.nlargest(10, num_col)  # Top 10 categories

            # Aggregate data for file B
            df_b_agg = df_b.groupby(cat_col)[num_col].sum().reset_index()
            df_b_agg = df_b_agg.nlargest(10, num_col)  # Top 10 categories

            if len(df_a_agg) == 0 or len(df_b_agg) == 0:
                return None

            return OverlayChartData(
                chart_type="bar",
                title=f"{num_col} by {cat_col}",
                file_a_name=file_a_name,
                file_b_name=file_b_name,
                x_column=cat_col,
                y_column=num_col,
                file_a_data=df_a_agg.to_dict('records'),
                file_b_data=df_b_agg.to_dict('records')
            )

        except Exception:
            return None

    def _create_scatter_overlay(
        self,
        df_a: pd.DataFrame,
        df_b: pd.DataFrame,
        x_col: str,
        y_col: str,
        file_a_name: str,
        file_b_name: str
    ) -> OverlayChartData:
        """Create overlay scatter plot."""
        try:
            # Sample data for file A
            df_a_sample = df_a[[x_col, y_col]].dropna()
            if len(df_a_sample) > 500:
                df_a_sample = df_a_sample.sample(500)

            # Sample data for file B
            df_b_sample = df_b[[x_col, y_col]].dropna()
            if len(df_b_sample) > 500:
                df_b_sample = df_b_sample.sample(500)

            if len(df_a_sample) == 0 or len(df_b_sample) == 0:
                return None

            return OverlayChartData(
                chart_type="scatter",
                title=f"{y_col} vs {x_col}",
                file_a_name=file_a_name,
                file_b_name=file_b_name,
                x_column=x_col,
                y_column=y_col,
                file_a_data=df_a_sample.to_dict('records'),
                file_b_data=df_b_sample.to_dict('records')
            )

        except Exception:
            return None

    def calculate_metrics(
        self,
        df_a: pd.DataFrame,
        df_b: pd.DataFrame
    ) -> Dict[str, Any]:
        """
        Calculate comparison metrics between two datasets.

        Args:
            df_a: First DataFrame
            df_b: Second DataFrame

        Returns:
            Dictionary with comparison metrics
        """
        numeric_cols, _, _ = self.find_common_columns(df_a, df_b)

        metrics = {
            "row_count_a": len(df_a),
            "row_count_b": len(df_b),
            "row_count_diff": len(df_b) - len(df_a),
            "row_count_pct_change": ((len(df_b) - len(df_a)) / len(df_a) * 100) if len(df_a) > 0 else 0,
            "numeric_columns": {}
        }

        # Calculate metrics for each numeric column
        for col in numeric_cols:
            mean_a = df_a[col].mean()
            mean_b = df_b[col].mean()
            sum_a = df_a[col].sum()
            sum_b = df_b[col].sum()

            metrics["numeric_columns"][col] = {
                "mean_a": float(mean_a) if pd.notna(mean_a) else None,
                "mean_b": float(mean_b) if pd.notna(mean_b) else None,
                "mean_diff": float(mean_b - mean_a) if pd.notna(mean_a) and pd.notna(mean_b) else None,
                "mean_pct_change": float((mean_b - mean_a) / mean_a * 100) if mean_a != 0 and pd.notna(mean_a) and pd.notna(mean_b) else None,
                "sum_a": float(sum_a) if pd.notna(sum_a) else None,
                "sum_b": float(sum_b) if pd.notna(sum_b) else None,
                "sum_diff": float(sum_b - sum_a) if pd.notna(sum_a) and pd.notna(sum_b) else None,
                "sum_pct_change": float((sum_b - sum_a) / sum_a * 100) if sum_a != 0 and pd.notna(sum_a) and pd.notna(sum_b) else None,
            }

        return metrics
