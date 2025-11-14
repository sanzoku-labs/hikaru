"""
AI Analysis Service - Generates chart suggestions and comparison insights.

This service is responsible for:
- Suggesting optimal charts based on data schema
- Generating comparison insights between files
- Generating chart-specific comparison insights
- Building analysis prompts with semantic column mapping

Extracted from AIService as part of Phase 4.1 refactoring.
"""

import json
import logging
from typing import Any, Dict, List, Optional

from anthropic import Anthropic

from app.config import settings
from app.models.schemas import DataSchema

logger = logging.getLogger(__name__)


class AIAnalysisService:
    """Service for AI-powered data analysis and chart suggestions"""

    def __init__(self) -> None:
        """Initialize AIAnalysisService."""
        if settings.anthropic_api_key:
            self.client = Anthropic(api_key=settings.anthropic_api_key)
            self.enabled = True
        else:
            self.client = None
            self.enabled = False
            logger.warning("ANTHROPIC_API_KEY not set. AI analysis will be disabled.")

    def suggest_charts(
        self, schema: DataSchema, user_intent: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Use AI to intelligently suggest 3-4 meaningful charts based on dataset schema.

        Args:
            schema: DataSchema with column information
            user_intent: Optional user description of what they want to analyze

        Returns:
            List of chart suggestions with format:
            [{"chart_type": "line", "x_column": "month_id", "y_column": "ret_amt",
              "title": "Revenue Over Time", "reasoning": "Time series analysis..."}]
        """
        if not self.enabled:
            return []

        try:
            logger.info(f"Suggesting charts with user_intent: {user_intent or 'None'}")
            prompt = self._build_chart_suggestion_prompt(schema, user_intent)

            message = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1000,
                messages=[{"role": "user", "content": prompt}],
            )

            response_text = message.content[0].text.strip()
            logger.debug(f"Raw AI response: {response_text[:500]}...")  # Log first 500 chars

            # Parse JSON response
            try:
                suggestions = json.loads(response_text)
            except json.JSONDecodeError as json_err:
                logger.error(f"JSON parsing error: {json_err}")
                logger.debug(f"Full response text: {response_text}")
                return []

            # Validate and return
            if isinstance(suggestions, list) and len(suggestions) > 0:
                logger.info(f"Successfully parsed {len(suggestions)} chart suggestions")
                return suggestions[:4]  # Limit to 4 charts
            else:
                logger.warning(f"AI returned empty or invalid suggestions: {suggestions}")
                return []

        except Exception as e:
            logger.error(f"Error suggesting charts: {e}", exc_info=True)
            return []

    async def generate_comparison_insight(
        self, file_a_name: str, file_b_name: str, metrics: Dict[str, Any], comparison_type: str
    ) -> str:
        """
        Generate AI insight comparing two files.

        Args:
            file_a_name: Name of first file
            file_b_name: Name of second file
            metrics: Comparison metrics dictionary
            comparison_type: Type of comparison (trend, yoy, side_by_side)

        Returns:
            Summary insight string
        """
        if not self.enabled:
            return f"Comparison between {file_a_name} and {file_b_name} generated successfully."

        try:
            prompt = f"""Analyze this data comparison and provide a concise business insight (3-4 sentences).

Comparison Type: {comparison_type}
File A: {file_a_name}
File B: {file_b_name}

Metrics:
- Row count change: {metrics.get('row_count_a', 0)} → {metrics.get('row_count_b', 0)} ({metrics.get('row_count_pct_change', 0):.1f}% change)

Numeric columns:
{json.dumps(metrics.get('numeric_columns', {}), indent=2)}

Focus on:
1. Most significant changes (both magnitude and percentage)
2. Business implications
3. Key trends or patterns
4. Actionable insights

Provide a concise summary highlighting the most important findings."""

            message = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=300,
                messages=[{"role": "user", "content": prompt}],
            )

            return message.content[0].text.strip()

        except Exception as e:
            logger.error(f"Error generating comparison insight: {e}")
            return f"Comparison between {file_a_name} and {file_b_name} shows data differences across multiple metrics."

    async def generate_chart_comparison_insight(
        self, chart: Any, metrics: Dict[str, Any]
    ) -> Optional[str]:
        """
        Generate insight for a specific comparison chart.

        Args:
            chart: OverlayChartData object
            metrics: Comparison metrics

        Returns:
            Insight string for the chart
        """
        if not self.enabled:
            return None

        try:
            # Get relevant metric for this chart's y_column
            y_col_metrics = metrics.get("numeric_columns", {}).get(chart.y_column, {})

            prompt = f"""Provide a 1-2 sentence insight for this comparison chart.

Chart: {chart.title}
Type: {chart.chart_type}
Comparing: {chart.file_a_name} vs {chart.file_b_name}
X-axis: {chart.x_column}
Y-axis: {chart.y_column}

Metrics for {chart.y_column}:
{json.dumps(y_col_metrics, indent=2)}

Focus on the most notable difference or trend visible in this specific chart."""

            message = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=150,
                messages=[{"role": "user", "content": prompt}],
            )

            return message.content[0].text.strip()

        except Exception:
            return None

    def _build_chart_suggestion_prompt(
        self, schema: DataSchema, user_intent: Optional[str]
    ) -> str:
        """Build prompt for AI chart suggestions"""
        # Format column information
        columns_info = []
        for col in schema.columns:
            col_desc = f"- {col.name} ({col.type})"
            if col.type == "categorical" and col.unique_values:
                col_desc += f" - {col.unique_values} unique values"
            if col.type == "numeric":
                col_desc += f" - range: {col.min} to {col.max}"
            if col.null_count > 0:
                col_desc += f" - {col.null_count} nulls"
            if col.sample_values:
                samples = [str(v) for v in col.sample_values[:3]]
                col_desc += f" - samples: {', '.join(samples)}"
            columns_info.append(col_desc)

        columns_text = "\n".join(columns_info)

        intent_text = (
            f"\nUser Intent: {user_intent}"
            if user_intent
            else "\nUser Intent: Not specified - suggest best general visualizations"
        )

        prompt = f"""You are an expert data analyst. Analyze this dataset and suggest 3-4 meaningful charts for visualization.

Dataset Information:
- Total Rows: {schema.row_count}
- Total Columns: {len(schema.columns)}

Columns:
{columns_text}
{intent_text}

IMPORTANT - USER INTENT HANDLING:
When user intent is provided, your PRIMARY goal is to answer their question directly:

1. SEMANTIC COLUMN MAPPING:
   - Extract key concepts from user intent (e.g., "regions", "products", "time periods", "performance", "sales")
   - Map concepts to actual columns by analyzing:
     a) Column names (both exact matches and semantic similarity)
     b) Column type (categorical, numeric, datetime)
     c) Unique value count (is there enough variation to compare?)
     d) Sample values (what do they represent?)

2. HANDLING INSUFFICIENT VARIATION:
   - If a column name matches user concept but has ≤1 unique value, REJECT it
   - Search for alternative columns that might represent the same concept:
     * Look for categorical columns with 2-50 unique values
     * Check sample values for patterns (codes, names, categories)
     * Technical names (codes, IDs with letters/numbers) may be dimensions in disguise

3. CONCEPT → COLUMN MAPPING EXAMPLES (adapt to actual dataset):
   - "regions/locations/areas/geography" → look for: region, area, location, zone, territory, state, city, district, country, OR categorical columns with geographic-looking codes/names
   - "products/items/goods" → look for: product, item, SKU, material, good, brand, model, OR categorical columns with product-like names
   - "time/period/date/trends" → look for: date, month, week, year, quarter, period (datetime or numeric time IDs)
   - "performance/sales/revenue/value" → look for: sales, revenue, amount, value, quantity, volume, price (numeric metrics)
   - "customers/clients/buyers" → look for: customer, client, account, buyer, OR categorical columns with customer-like codes

4. SMART FALLBACKS:
   - If user's exact concept isn't available, use the CLOSEST meaningful alternative
   - In chart title and reasoning, explain what column was used and why
   - Example: "Revenue by uga746 (regional codes)" or "Sales by prod_cd (product identifier)"

5. DIRECT QUESTION ANSWERING:
   - Charts MUST directly address the user's question
   - Don't generate generic/unrelated charts just to fill the quota
   - If only 2 relevant charts can answer the question, return 2 (not 4 unrelated ones)

Instructions:
1. SKIP these types of columns from visualization:
   - ID columns (names ending with _id, _code, _cip, containing 'id', 'code')
     EXCEPTION: Always KEEP time-related columns even if they end with _id
     (month_id, week_id, year_id, day_id, date_id, quarter_id, period_id)
   - Columns with only 1 unique value (no variation to visualize)
   - Columns with >90% null values
   - Columns that are clearly identifiers (pharmacy_cip, prod_cd, etc.)

2. PRIORITIZE these column types:
   - Time dimensions (month_id, week_id, year, quarter, date columns) → use for time series
   - Metrics/measures (amount, revenue, sales, quantity, price, qty, ret_amt) → use as Y-axis values
   - Dimensions (name, product, region, category, type) → use for grouping/categorization

3. CHART TYPE SELECTION:
   - Line chart: Time column (X) + Numeric metric (Y) - best for trends
   - Bar chart: Categorical dimension (X) + Numeric metric (Y) - best for comparisons
   - Pie chart: Categorical (2-8 unique values) + Numeric metric - best for proportions
   - Scatter plot: Two numeric columns - best for correlations

4. OUTPUT FORMAT (JSON array, no markdown):
[
  {{
    "chart_type": "line|bar|pie|scatter",
    "x_column": "column_name" (optional for pie),
    "y_column": "column_name",
    "category_column": "column_name" (for pie charts),
    "value_column": "column_name" (for pie charts),
    "title": "Descriptive chart title",
    "reasoning": "Why this chart is meaningful for this data"
  }}
]

IMPORTANT:
- Return ONLY valid JSON array, no explanation text
- Suggest 2-4 charts maximum (fewer is better if they directly answer the question)
- Focus on charts that provide business insights
- When user intent is provided, PRIORITIZE charts that directly answer their question
- If user's question cannot be fully answered (missing data/columns), use closest alternative and explain in reasoning
- Use descriptive chart titles that reference actual column names (especially if technical/cryptic names)
- In reasoning field, explain why each chart answers the user's question"""

        return prompt
