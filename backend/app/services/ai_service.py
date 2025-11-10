from anthropic import Anthropic
from app.config import settings
from app.models.schemas import DataSchema, ChartData
from typing import List, Dict, Optional
import json
from datetime import datetime, timedelta

# Simple in-memory cache for MVP (24-hour TTL)
_insight_cache: Dict[str, tuple[str, datetime]] = {}


class AIService:
    """Service for generating AI insights using Claude Sonnet 4"""

    def __init__(self):
        if settings.anthropic_api_key:
            self.client = Anthropic(api_key=settings.anthropic_api_key)
            self.enabled = True
        else:
            self.client = None
            self.enabled = False
            print("Warning: ANTHROPIC_API_KEY not set. AI insights will be disabled.")

    def generate_chart_insight(self, chart: ChartData, schema: DataSchema) -> Optional[str]:
        """Generate insight for a single chart"""
        if not self.enabled:
            return None

        # Check cache
        cache_key = f"chart_{chart.chart_type}_{chart.title}"
        if cache_key in _insight_cache:
            cached_insight, cached_time = _insight_cache[cache_key]
            if datetime.now() - cached_time < timedelta(hours=24):
                return cached_insight

        try:
            prompt = self._build_chart_prompt(chart, schema)

            message = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=200,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            insight = message.content[0].text.strip()

            # Cache the result
            _insight_cache[cache_key] = (insight, datetime.now())

            return insight

        except Exception as e:
            print(f"Error generating chart insight: {e}")
            return None

    def generate_global_summary(self, charts: List[ChartData], schema: DataSchema) -> Optional[str]:
        """Generate overall summary of the data"""
        if not self.enabled:
            return None

        # Check cache
        cache_key = f"summary_{len(charts)}_{schema.row_count}"
        if cache_key in _insight_cache:
            cached_summary, cached_time = _insight_cache[cache_key]
            if datetime.now() - cached_time < timedelta(hours=24):
                return cached_summary

        try:
            prompt = self._build_summary_prompt(charts, schema)

            message = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=300,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            summary = message.content[0].text.strip()

            # Cache the result
            _insight_cache[cache_key] = (summary, datetime.now())

            return summary

        except Exception as e:
            print(f"Error generating global summary: {e}")
            return None

    def _build_chart_prompt(self, chart: ChartData, schema: DataSchema) -> str:
        """Build prompt for chart-specific insight"""

        # Format actual data based on chart type
        data_section = self._format_chart_data(chart)

        prompt = f"""Analyze this {chart.chart_type} chart and provide a brief, insightful observation (2-3 sentences maximum).

Chart: {chart.title}
Type: {chart.chart_type}
Data points: {len(chart.data)}

{data_section}

Focus on:
- Key patterns or trends
- Notable outliers or anomalies
- Practical business insights

Be concise and specific. Avoid generic statements."""

        return prompt

    def _format_chart_data(self, chart: ChartData) -> str:
        """Format chart data for inclusion in prompt"""
        if chart.chart_type == "pie":
            return self._format_pie_data(chart)
        elif chart.chart_type == "bar":
            return self._format_bar_data(chart)
        elif chart.chart_type == "line":
            return self._format_line_data(chart)
        elif chart.chart_type == "scatter":
            return self._format_scatter_data(chart)
        return ""

    def _format_pie_data(self, chart: ChartData) -> str:
        """Format pie chart data with percentages"""
        data = chart.data
        total = sum(item["value"] for item in data)

        lines = ["Actual Data:"]
        for item in data:
            value = item["value"]
            percentage = (value / total * 100) if total > 0 else 0
            lines.append(f"- {item['name']}: {value:,.2f} ({percentage:.1f}%)")
        lines.append(f"Total: {total:,.2f}")

        return "\n".join(lines)

    def _format_bar_data(self, chart: ChartData) -> str:
        """Format bar chart data"""
        data = chart.data
        values = [item["value"] for item in data]
        total = sum(values)
        avg = total / len(values) if values else 0

        lines = ["Actual Data:"]
        for item in data:
            lines.append(f"- {item['category']}: {item['value']:,.2f}")
        lines.append(f"\nStatistics: Total={total:,.2f}, Average={avg:,.2f}, Min={min(values):,.2f}, Max={max(values):,.2f}")

        return "\n".join(lines)

    def _format_line_data(self, chart: ChartData) -> str:
        """Format line chart data (time series)"""
        data = chart.data

        # Include all points if reasonable (<=20), otherwise sample
        if len(data) <= 20:
            lines = ["Actual Data:"]
            for item in data:
                lines.append(f"- {item['x']}: {item['y']:,.2f}")
        else:
            # Show first 5, last 5, and statistics
            lines = ["Actual Data (sample):"]
            lines.append("First 5 points:")
            for item in data[:5]:
                lines.append(f"- {item['x']}: {item['y']:,.2f}")
            lines.append("\nLast 5 points:")
            for item in data[-5:]:
                lines.append(f"- {item['x']}: {item['y']:,.2f}")

        # Add statistics
        values = [item["y"] for item in data]
        total = sum(values)
        avg = total / len(values) if values else 0
        lines.append(f"\nStatistics: Total={total:,.2f}, Average={avg:,.2f}, Min={min(values):,.2f}, Max={max(values):,.2f}")

        return "\n".join(lines)

    def _format_scatter_data(self, chart: ChartData) -> str:
        """Format scatter plot data (limit to sample + statistics)"""
        data = chart.data

        # Show sample of 10 points + statistics
        lines = ["Actual Data (sample of first 10 points):"]
        for item in data[:10]:
            lines.append(f"- ({item['x']:.2f}, {item['y']:.2f})")

        # Add statistics
        x_values = [item["x"] for item in data]
        y_values = [item["y"] for item in data]
        lines.append(f"\nX-axis: Min={min(x_values):.2f}, Max={max(x_values):.2f}, Average={sum(x_values)/len(x_values):.2f}")
        lines.append(f"Y-axis: Min={min(y_values):.2f}, Max={max(y_values):.2f}, Average={sum(y_values)/len(y_values):.2f}")
        lines.append(f"Total points: {len(data)}")

        return "\n".join(lines)

    def _build_summary_prompt(self, charts: List[ChartData], schema: DataSchema) -> str:
        """Build prompt for global data summary"""
        chart_titles = [chart.title for chart in charts]

        column_types = {
            "numeric": [col.name for col in schema.columns if col.type == "numeric"],
            "categorical": [col.name for col in schema.columns if col.type == "categorical"],
            "datetime": [col.name for col in schema.columns if col.type == "datetime"],
        }

        prompt = f"""Provide a high-level summary of this dataset (3-4 sentences maximum).

Dataset Information:
- Total rows: {schema.row_count}
- Columns: {len(schema.columns)}
- Numeric columns: {', '.join(column_types['numeric'][:5])}
- Categorical columns: {', '.join(column_types['categorical'][:5])}
- Datetime columns: {', '.join(column_types['datetime'][:5])}

Generated Charts: {', '.join(chart_titles)}

Summarize:
- What type of data this is
- Key dimensions being analyzed
- Most important findings or patterns
- Potential business use cases

Be concise and actionable."""

        return prompt

    @staticmethod
    def clear_cache():
        """Clear the insight cache (useful for testing)"""
        global _insight_cache
        _insight_cache.clear()
