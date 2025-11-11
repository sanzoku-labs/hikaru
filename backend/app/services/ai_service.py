from anthropic import Anthropic
from app.config import settings
from app.models.schemas import DataSchema, ChartData, ConversationMessage
from typing import List, Dict, Optional
import json
import uuid
from datetime import datetime, timedelta

# Simple in-memory cache for MVP (24-hour TTL)
_insight_cache: Dict[str, tuple[str, datetime]] = {}

# Conversation storage (upload_id -> {conversation_id -> messages})
_conversations: Dict[str, Dict[str, List[ConversationMessage]]] = {}


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

    def generate_query_response(
        self,
        upload_id: str,
        question: str,
        schema: DataSchema,
        conversation_id: Optional[str] = None
    ) -> tuple[str, str, Optional[Dict]]:
        """
        Generate response to user's natural language question about the data.

        Returns: (answer, conversation_id, chart_config)
        chart_config is a dict with chart generation instructions if user requested visualization
        """
        if not self.enabled:
            return "AI service is not available. Please configure ANTHROPIC_API_KEY.", "", None

        # Get or create conversation
        if conversation_id:
            conversation = self._get_conversation(upload_id, conversation_id)
        else:
            conversation_id = str(uuid.uuid4())
            conversation = []

        # Build prompt with data context and conversation history
        prompt = self._build_query_prompt(question, schema, conversation)

        try:
            message = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=600,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            answer = message.content[0].text.strip()

            # Parse response for chart generation request
            chart_config = self._parse_chart_request(answer)

            # Store conversation (store the answer without JSON formatting)
            clean_answer = self._extract_clean_answer(answer)
            self._store_conversation(upload_id, conversation_id, question, clean_answer)

            return clean_answer, conversation_id, chart_config

        except Exception as e:
            print(f"Error generating query response: {e}")
            return "Sorry, I encountered an error processing your question.", conversation_id, None

    def _build_query_prompt(
        self,
        question: str,
        schema: DataSchema,
        conversation: List[ConversationMessage]
    ) -> str:
        """Build prompt for Q&A with data context"""

        # Format data schema
        column_info = []
        for col in schema.columns:
            info = f"- {col.name} ({col.type})"
            if col.type == "numeric" and col.min is not None:
                info += f": range {col.min:.2f} to {col.max:.2f}, avg {col.mean:.2f}"
            elif col.type == "categorical" and col.unique_values:
                info += f": {col.unique_values} unique values"
                if col.sample_values:
                    samples = ", ".join(str(v) for v in col.sample_values[:5])
                    info += f" (e.g., {samples})"
            column_info.append(info)

        # Format conversation history
        history = ""
        if conversation:
            history = "\n\nPrevious conversation:\n"
            for msg in conversation[-5:]:  # Last 5 messages
                history += f"{msg.role.capitalize()}: {msg.content}\n"

        # Check if this is a visualization request
        viz_keywords = ["show", "visualize", "chart", "graph", "plot", "display", "create"]
        is_viz_request = any(keyword in question.lower() for keyword in viz_keywords)

        if is_viz_request:
            prompt = f"""The user is requesting a DATA VISUALIZATION. You MUST respond in this EXACT format:

[Brief 1-sentence description]

CHART_CONFIG: {{"chart_type": "TYPE", "category_column": "COL", "value_column": "COL", "title": "Title"}}

Dataset columns:
{chr(10).join(column_info)}

Sample data:
{self._format_sample_data(schema.preview[:3])}

User question: {question}

SELECT THE CORRECT CHART TYPE:
- BAR chart: For categorical + numeric (e.g., revenue by region)
- PIE chart: For categorical + numeric showing parts of whole
- LINE chart: For datetime + numeric (trends over time)
- SCATTER: For two numeric columns

RESPOND NOW with the format above. Use ONLY columns that exist in the dataset."""
        else:
            prompt = f"""You are a data analyst helping a user understand their dataset.

Dataset Information:
- Total rows: {schema.row_count}
- Columns:
{chr(10).join(column_info)}

Sample data (first 3 rows):
{self._format_sample_data(schema.preview[:3])}
{history}

User's question: {question}

Provide a clear, concise answer based on the data. If you need specific data values that aren't in the sample, make reasonable inferences based on the schema and sample. Be helpful and specific."""

        return prompt

    def _format_sample_data(self, preview: List[Dict]) -> str:
        """Format sample data rows for prompt"""
        if not preview:
            return "(no sample data)"

        lines = []
        for i, row in enumerate(preview, 1):
            row_str = ", ".join(f"{k}: {v}" for k, v in row.items())
            lines.append(f"  Row {i}: {row_str}")

        return "\n".join(lines)

    def _get_conversation(self, upload_id: str, conversation_id: str) -> List[ConversationMessage]:
        """Retrieve conversation history"""
        if upload_id not in _conversations:
            return []
        if conversation_id not in _conversations[upload_id]:
            return []
        return _conversations[upload_id][conversation_id]

    def _store_conversation(
        self,
        upload_id: str,
        conversation_id: str,
        question: str,
        answer: str
    ):
        """Store question and answer in conversation history"""
        if upload_id not in _conversations:
            _conversations[upload_id] = {}
        if conversation_id not in _conversations[upload_id]:
            _conversations[upload_id][conversation_id] = []

        now = datetime.now()

        # Add user question
        _conversations[upload_id][conversation_id].append(
            ConversationMessage(
                role="user",
                content=question,
                timestamp=now
            )
        )

        # Add assistant answer
        _conversations[upload_id][conversation_id].append(
            ConversationMessage(
                role="assistant",
                content=answer,
                timestamp=now
            )
        )

    def _parse_chart_request(self, answer: str) -> Optional[Dict]:
        """
        Parse AI response for CHART_CONFIG JSON.
        Returns chart config dict if found, None otherwise.
        """
        if "CHART_CONFIG:" not in answer:
            return None

        try:
            # Extract JSON after CHART_CONFIG:
            config_start = answer.find("CHART_CONFIG:")
            config_json = answer[config_start + len("CHART_CONFIG:"):].strip()

            # Find the JSON object
            if config_json.startswith("{"):
                # Find matching closing brace
                brace_count = 0
                end_idx = 0
                for i, char in enumerate(config_json):
                    if char == "{":
                        brace_count += 1
                    elif char == "}":
                        brace_count -= 1
                        if brace_count == 0:
                            end_idx = i + 1
                            break

                config_json = config_json[:end_idx]
                config = json.loads(config_json)

                # Validate required fields
                if "chart_type" in config and "title" in config:
                    return config

        except (json.JSONDecodeError, ValueError) as e:
            print(f"Failed to parse CHART_CONFIG: {e}")

        return None

    def _extract_clean_answer(self, answer: str) -> str:
        """Remove CHART_CONFIG JSON from answer to get clean text"""
        if "CHART_CONFIG:" in answer:
            config_start = answer.find("CHART_CONFIG:")
            return answer[:config_start].strip()
        return answer

    def suggest_charts(self, schema: DataSchema, user_intent: Optional[str] = None) -> List[Dict]:
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
            print(f"[AIService] Suggesting charts with user_intent: {user_intent or 'None'}")
            prompt = self._build_chart_suggestion_prompt(schema, user_intent)

            message = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1000,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            response_text = message.content[0].text.strip()
            print(f"[AIService] Raw AI response: {response_text[:500]}...")  # Log first 500 chars

            # Parse JSON response
            try:
                suggestions = json.loads(response_text)
            except json.JSONDecodeError as json_err:
                print(f"[AIService] JSON parsing error: {json_err}")
                print(f"[AIService] Full response text: {response_text}")
                return []

            # Validate and return
            if isinstance(suggestions, list) and len(suggestions) > 0:
                print(f"[AIService] Successfully parsed {len(suggestions)} chart suggestions")
                return suggestions[:4]  # Limit to 4 charts
            else:
                print(f"[AIService] AI returned empty or invalid suggestions: {suggestions}")
                return []

        except Exception as e:
            print(f"[AIService] Error suggesting charts: {e}")
            import traceback
            traceback.print_exc()
            return []

    def _build_chart_suggestion_prompt(self, schema: DataSchema, user_intent: Optional[str]) -> str:
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

        intent_text = f"\nUser Intent: {user_intent}" if user_intent else "\nUser Intent: Not specified - suggest best general visualizations"

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

    async def generate_comparison_insight(
        self,
        file_a_name: str,
        file_b_name: str,
        metrics: Dict,
        comparison_type: str
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
                messages=[{"role": "user", "content": prompt}]
            )

            return message.content[0].text.strip()

        except Exception as e:
            print(f"Error generating comparison insight: {e}")
            return f"Comparison between {file_a_name} and {file_b_name} shows data differences across multiple metrics."

    async def generate_chart_comparison_insight(
        self,
        chart,
        metrics: Dict
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
            y_col_metrics = metrics.get('numeric_columns', {}).get(chart.y_column, {})

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
                messages=[{"role": "user", "content": prompt}]
            )

            return message.content[0].text.strip()

        except Exception:
            return None

    @staticmethod
    def clear_cache():
        """Clear the insight cache (useful for testing)"""
        global _insight_cache
        _insight_cache.clear()

    @staticmethod
    def clear_conversations():
        """Clear all conversations (useful for testing)"""
        global _conversations
        _conversations.clear()
