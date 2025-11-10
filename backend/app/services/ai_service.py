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
        chart_info = {
            "type": chart.chart_type,
            "title": chart.title,
            "data_points": len(chart.data),
        }

        if chart.chart_type == "line":
            chart_info["x_axis"] = chart.x_column
            chart_info["y_axis"] = chart.y_column
        elif chart.chart_type == "bar":
            chart_info["categories"] = chart.category_column
            chart_info["values"] = chart.value_column
        elif chart.chart_type == "pie":
            chart_info["categories"] = chart.category_column
            chart_info["values"] = chart.value_column
        elif chart.chart_type == "scatter":
            chart_info["x_axis"] = chart.x_column
            chart_info["y_axis"] = chart.y_column

        prompt = f"""Analyze this {chart.chart_type} chart and provide a brief, insightful observation (2-3 sentences maximum).

Chart: {chart.title}
Type: {chart.chart_type}
Data points: {len(chart.data)}

Focus on:
- Key patterns or trends
- Notable outliers or anomalies
- Practical business insights

Be concise and specific. Avoid generic statements."""

        return prompt

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
