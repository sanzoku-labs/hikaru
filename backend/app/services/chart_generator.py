import logging
from typing import Any, Dict, List, Literal, Optional

import pandas as pd

from app.models.schemas import ColumnInfo, DataSchema

logger = logging.getLogger(__name__)

ChartType = Literal["line", "bar", "pie", "scatter"]


class ChartConfig:
    def __init__(
        self,
        chart_type: ChartType,
        title: str,
        x_column: Optional[str] = None,
        y_column: Optional[str] = None,
        category_column: Optional[str] = None,
        value_column: Optional[str] = None,
        data: List[Dict[str, Any]] = None,
        priority: int = 0,
    ):
        self.chart_type = chart_type
        self.title = title
        self.x_column = x_column
        self.y_column = y_column
        self.category_column = category_column
        self.value_column = value_column
        self.data = data or []
        self.priority = priority

    def to_dict(self) -> Dict[str, Any]:
        return {
            "chart_type": self.chart_type,
            "title": self.title,
            "x_column": self.x_column,
            "y_column": self.y_column,
            "category_column": self.category_column,
            "value_column": self.value_column,
            "data": self.data,
            "priority": self.priority,
        }


class ChartGenerator:
    """
    Priority-based chart generation with heuristics.

    Priority order:
    1. Datetime + Numeric → Line Chart
    2. Categorical (≤8 values) + Numeric → Pie Chart
    3. Categorical + Numeric → Bar Chart
    4. 2+ Numeric columns → Scatter Plot
    """

    @staticmethod
    def _should_skip_column(col_name: str, col_info: ColumnInfo, total_rows: int) -> bool:
        """
        Determine if a column should be skipped for visualization.

        Skips:
        - ID columns (except time dimensions like month_id, week_id)
        - Columns with only 1 unique value (no variation)
        - Columns with >90% null values
        """
        # Check if it's an ID column (but keep time dimensions)
        col_name_lower = col_name.lower()
        time_keywords = ["month", "week", "year", "quarter", "day", "date", "period"]
        is_time_column = any(kw in col_name_lower for kw in time_keywords)

        if not is_time_column:
            # Skip ID-like columns
            if col_name.endswith(("_id", "_code", "_cip", "_cd")):
                return True
            if any(word in col_name_lower for word in ["id", "code"]):
                # Be conservative: only skip if it's clearly an ID
                if col_name_lower.endswith("id") or col_name_lower.endswith("code"):
                    return True

        # Skip columns with only 1 unique value
        if col_info.unique_values == 1:
            return True

        # Skip columns with >90% nulls
        if col_info.null_count > 0.9 * total_rows:
            return True

        return False

    @staticmethod
    def generate_charts(
        df: pd.DataFrame, schema: DataSchema, max_charts: int = 4
    ) -> List[Dict[str, Any]]:
        """Generate up to max_charts based on data schema"""
        potential_charts = []

        # Get column types with filtering
        datetime_cols = []
        numeric_cols = []
        categorical_cols = []

        for col_info in schema.columns:
            if ChartGenerator._should_skip_column(col_info.name, col_info, schema.row_count):
                continue

            if col_info.type == "datetime":
                datetime_cols.append(col_info.name)
            elif col_info.type == "numeric":
                numeric_cols.append(col_info.name)
            elif col_info.type == "categorical":
                categorical_cols.append(col_info.name)

        # Priority 1: Datetime + Numeric → Line Chart
        for dt_col in datetime_cols:
            for num_col in numeric_cols:
                chart = ChartGenerator._create_line_chart(df, dt_col, num_col, priority=1)
                if chart:
                    potential_charts.append(chart)

        # Priority 2: Categorical (2-8 unique) + Numeric → Pie Chart
        for cat_col in categorical_cols:
            col_info = next((c for c in schema.columns if c.name == cat_col), None)
            # Require at least 2 unique values to avoid useless single-category pie charts
            if col_info and col_info.unique_values and 2 <= col_info.unique_values <= 8:
                for num_col in numeric_cols:
                    chart = ChartGenerator._create_pie_chart(df, cat_col, num_col, priority=2)
                    if chart:
                        potential_charts.append(chart)

        # Priority 3: Categorical + Numeric → Bar Chart
        for cat_col in categorical_cols:
            for num_col in numeric_cols:
                chart = ChartGenerator._create_bar_chart(df, cat_col, num_col, priority=3)
                if chart:
                    potential_charts.append(chart)

        # Priority 4: 2+ Numeric → Scatter Plot
        if len(numeric_cols) >= 2:
            for i, x_col in enumerate(numeric_cols):
                for y_col in numeric_cols[i + 1 :]:
                    chart = ChartGenerator._create_scatter_chart(df, x_col, y_col, priority=4)
                    if chart:
                        potential_charts.append(chart)

        # Sort by priority and limit to max_charts
        potential_charts.sort(key=lambda c: c.priority)
        selected_charts = potential_charts[:max_charts]

        return [chart.to_dict() for chart in selected_charts]

    @staticmethod
    def _create_line_chart(
        df: pd.DataFrame, x_col: str, y_col: str, priority: int
    ) -> Optional[ChartConfig]:
        """Create line chart for datetime vs numeric"""
        try:
            # Sort by datetime
            chart_df = df[[x_col, y_col]].dropna().sort_values(by=x_col)

            data = [
                {"x": str(row[x_col]), "y": float(row[y_col])} for _, row in chart_df.iterrows()
            ]

            return ChartConfig(
                chart_type="line",
                title=f"{y_col} over {x_col}",
                x_column=x_col,
                y_column=y_col,
                data=data,
                priority=priority,
            )
        except Exception as e:
            logger.error(f"Error creating line chart: {e}")
            return None

    @staticmethod
    def _create_pie_chart(
        df: pd.DataFrame, cat_col: str, val_col: str, priority: int
    ) -> Optional[ChartConfig]:
        """Create pie chart for categorical distribution"""
        try:
            # Aggregate by category
            grouped = df.groupby(cat_col)[val_col].sum().reset_index()

            data = [
                {"name": str(row[cat_col]), "value": float(row[val_col])}
                for _, row in grouped.iterrows()
            ]

            return ChartConfig(
                chart_type="pie",
                title=f"{val_col} by {cat_col}",
                category_column=cat_col,
                value_column=val_col,
                data=data,
                priority=priority,
            )
        except Exception as e:
            logger.error(f"Error creating pie chart: {e}")
            return None

    @staticmethod
    def _create_bar_chart(
        df: pd.DataFrame, cat_col: str, val_col: str, priority: int
    ) -> Optional[ChartConfig]:
        """Create bar chart for categorical comparison"""
        try:
            # Aggregate by category
            grouped = df.groupby(cat_col)[val_col].sum().reset_index()

            # Limit to top 15 categories to avoid overcrowding
            if len(grouped) > 15:
                grouped = grouped.nlargest(15, val_col)

            data = [
                {"category": str(row[cat_col]), "value": float(row[val_col])}
                for _, row in grouped.iterrows()
            ]

            return ChartConfig(
                chart_type="bar",
                title=f"{val_col} by {cat_col}",
                category_column=cat_col,
                value_column=val_col,
                data=data,
                priority=priority,
            )
        except Exception as e:
            logger.error(f"Error creating bar chart: {e}")
            return None

    @staticmethod
    def _create_scatter_chart(
        df: pd.DataFrame, x_col: str, y_col: str, priority: int
    ) -> Optional[ChartConfig]:
        """Create scatter plot for numeric correlation"""
        try:
            # Sample if too many points (max 500 for performance)
            chart_df = df[[x_col, y_col]].dropna()
            if len(chart_df) > 500:
                chart_df = chart_df.sample(500)

            data = [
                {"x": float(row[x_col]), "y": float(row[y_col])} for _, row in chart_df.iterrows()
            ]

            return ChartConfig(
                chart_type="scatter",
                title=f"{y_col} vs {x_col}",
                x_column=x_col,
                y_column=y_col,
                data=data,
                priority=priority,
            )
        except Exception as e:
            logger.error(f"Error creating scatter chart: {e}")
            return None

    def generate_charts_from_suggestions(
        self, df: pd.DataFrame, schema: DataSchema, suggestions: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Generate charts based on AI suggestions.

        Args:
            df: DataFrame with data
            schema: DataSchema
            suggestions: List of chart suggestions from AI service

        Returns:
            List of chart data dictionaries
        """
        logger.info(f"Generating charts from {len(suggestions)} AI suggestions")
        charts = []

        for idx, suggestion in enumerate(suggestions):
            logger.debug(
                f"Processing suggestion {idx + 1}/{len(suggestions)}: {suggestion.get('chart_type', 'unknown')} - {suggestion.get('title', 'untitled')}"
            )
            try:
                chart_type = suggestion.get("chart_type")
                title = suggestion.get("title", "Chart")

                # Create chart based on type
                if chart_type == "line":
                    chart = self._create_line_chart_from_suggestion(df, suggestion)
                elif chart_type == "bar":
                    chart = self._create_bar_chart_from_suggestion(df, suggestion)
                elif chart_type == "pie":
                    chart = self._create_pie_chart_from_suggestion(df, suggestion)
                elif chart_type == "scatter":
                    chart = self._create_scatter_chart_from_suggestion(df, suggestion)
                else:
                    logger.warning(f"Unknown chart type from AI: {chart_type}")
                    continue

                if chart:
                    charts.append(chart.to_dict())

            except Exception as e:
                logger.error(
                    f"Error generating chart from suggestion {suggestion}: {e}", exc_info=True
                )
                continue

        logger.info(f"Successfully generated {len(charts)} charts from AI suggestions")
        return charts

    def _create_line_chart_from_suggestion(
        self, df: pd.DataFrame, suggestion: Dict[str, Any]
    ) -> Optional[ChartConfig]:
        """Create line chart from AI suggestion"""
        x_col = suggestion.get("x_column")
        y_col = suggestion.get("y_column")

        if not x_col or not y_col or x_col not in df.columns or y_col not in df.columns:
            return None

        # Use existing method
        return self._create_line_chart(df, x_col, y_col, priority=1)

    def _create_bar_chart_from_suggestion(
        self, df: pd.DataFrame, suggestion: Dict[str, Any]
    ) -> Optional[ChartConfig]:
        """Create bar chart from AI suggestion"""
        x_col = suggestion.get("x_column")
        y_col = suggestion.get("y_column")

        if not x_col or not y_col or x_col not in df.columns or y_col not in df.columns:
            return None

        # Use existing method
        return self._create_bar_chart(df, x_col, y_col, priority=2)

    def _create_pie_chart_from_suggestion(
        self, df: pd.DataFrame, suggestion: Dict[str, Any]
    ) -> Optional[ChartConfig]:
        """Create pie chart from AI suggestion"""
        category_col = suggestion.get("category_column")
        value_col = suggestion.get("value_column")

        if (
            not category_col
            or not value_col
            or category_col not in df.columns
            or value_col not in df.columns
        ):
            return None

        # Use existing method
        return self._create_pie_chart(df, category_col, value_col, priority=3)

    def _create_scatter_chart_from_suggestion(
        self, df: pd.DataFrame, suggestion: Dict[str, Any]
    ) -> Optional[ChartConfig]:
        """Create scatter chart from AI suggestion"""
        x_col = suggestion.get("x_column")
        y_col = suggestion.get("y_column")

        if not x_col or not y_col or x_col not in df.columns or y_col not in df.columns:
            return None

        # Use existing method
        return self._create_scatter_chart(df, x_col, y_col, priority=4)
