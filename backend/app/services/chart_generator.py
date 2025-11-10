import pandas as pd
from typing import List, Dict, Any, Optional, Literal
from app.models.schemas import DataSchema, ColumnInfo

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
        priority: int = 0
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
            "priority": self.priority
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
    def generate_charts(df: pd.DataFrame, schema: DataSchema, max_charts: int = 4) -> List[Dict[str, Any]]:
        """Generate up to max_charts based on data schema"""
        potential_charts = []

        # Get column types
        datetime_cols = [col.name for col in schema.columns if col.type == "datetime"]
        numeric_cols = [col.name for col in schema.columns if col.type == "numeric"]
        categorical_cols = [col.name for col in schema.columns if col.type == "categorical"]

        # Priority 1: Datetime + Numeric → Line Chart
        for dt_col in datetime_cols:
            for num_col in numeric_cols:
                chart = ChartGenerator._create_line_chart(df, dt_col, num_col, priority=1)
                if chart:
                    potential_charts.append(chart)

        # Priority 2: Categorical (≤8 unique) + Numeric → Pie Chart
        for cat_col in categorical_cols:
            col_info = next((c for c in schema.columns if c.name == cat_col), None)
            if col_info and col_info.unique_values and col_info.unique_values <= 8:
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
                for y_col in numeric_cols[i+1:]:
                    chart = ChartGenerator._create_scatter_chart(df, x_col, y_col, priority=4)
                    if chart:
                        potential_charts.append(chart)

        # Sort by priority and limit to max_charts
        potential_charts.sort(key=lambda c: c.priority)
        selected_charts = potential_charts[:max_charts]

        return [chart.to_dict() for chart in selected_charts]

    @staticmethod
    def _create_line_chart(df: pd.DataFrame, x_col: str, y_col: str, priority: int) -> Optional[ChartConfig]:
        """Create line chart for datetime vs numeric"""
        try:
            # Sort by datetime
            chart_df = df[[x_col, y_col]].dropna().sort_values(by=x_col)

            data = [
                {
                    "x": str(row[x_col]),
                    "y": float(row[y_col])
                }
                for _, row in chart_df.iterrows()
            ]

            return ChartConfig(
                chart_type="line",
                title=f"{y_col} over {x_col}",
                x_column=x_col,
                y_column=y_col,
                data=data,
                priority=priority
            )
        except Exception as e:
            print(f"Error creating line chart: {e}")
            return None

    @staticmethod
    def _create_pie_chart(df: pd.DataFrame, cat_col: str, val_col: str, priority: int) -> Optional[ChartConfig]:
        """Create pie chart for categorical distribution"""
        try:
            # Aggregate by category
            grouped = df.groupby(cat_col)[val_col].sum().reset_index()

            data = [
                {
                    "name": str(row[cat_col]),
                    "value": float(row[val_col])
                }
                for _, row in grouped.iterrows()
            ]

            return ChartConfig(
                chart_type="pie",
                title=f"{val_col} by {cat_col}",
                category_column=cat_col,
                value_column=val_col,
                data=data,
                priority=priority
            )
        except Exception as e:
            print(f"Error creating pie chart: {e}")
            return None

    @staticmethod
    def _create_bar_chart(df: pd.DataFrame, cat_col: str, val_col: str, priority: int) -> Optional[ChartConfig]:
        """Create bar chart for categorical comparison"""
        try:
            # Aggregate by category
            grouped = df.groupby(cat_col)[val_col].sum().reset_index()

            # Limit to top 15 categories to avoid overcrowding
            if len(grouped) > 15:
                grouped = grouped.nlargest(15, val_col)

            data = [
                {
                    "category": str(row[cat_col]),
                    "value": float(row[val_col])
                }
                for _, row in grouped.iterrows()
            ]

            return ChartConfig(
                chart_type="bar",
                title=f"{val_col} by {cat_col}",
                category_column=cat_col,
                value_column=val_col,
                data=data,
                priority=priority
            )
        except Exception as e:
            print(f"Error creating bar chart: {e}")
            return None

    @staticmethod
    def _create_scatter_chart(df: pd.DataFrame, x_col: str, y_col: str, priority: int) -> Optional[ChartConfig]:
        """Create scatter plot for numeric correlation"""
        try:
            # Sample if too many points (max 500 for performance)
            chart_df = df[[x_col, y_col]].dropna()
            if len(chart_df) > 500:
                chart_df = chart_df.sample(500)

            data = [
                {
                    "x": float(row[x_col]),
                    "y": float(row[y_col])
                }
                for _, row in chart_df.iterrows()
            ]

            return ChartConfig(
                chart_type="scatter",
                title=f"{y_col} vs {x_col}",
                x_column=x_col,
                y_column=y_col,
                data=data,
                priority=priority
            )
        except Exception as e:
            print(f"Error creating scatter chart: {e}")
            return None
