"""
Unit tests for AIAnalysisService.

Tests AI-powered chart suggestions and comparison insights with mocked Anthropic API.
"""
import json
from unittest.mock import AsyncMock, Mock, patch

import pytest

from app.models.schemas import ColumnInfo, DataSchema
from app.services.ai_analysis_service import AIAnalysisService


@pytest.fixture
def sample_schema():
    """Create sample data schema"""
    return DataSchema(
        columns=[
            ColumnInfo(
                name="month_id",
                type="numeric",
                unique_values=12,
                null_count=0,
                sample_values=[202401, 202402, 202403],
                min=202401,
                max=202412,
                mean=202406.5,
                median=202406,
            ),
            ColumnInfo(
                name="revenue",
                type="numeric",
                unique_values=12,
                null_count=0,
                sample_values=[1000, 1500, 2000],
                min=1000,
                max=5000,
                mean=2500,
                median=2400,
            ),
            ColumnInfo(
                name="region",
                type="categorical",
                unique_values=5,
                null_count=0,
                sample_values=["North", "South", "East"],
            ),
        ],
        row_count=60,
        preview=[
            {"month_id": 202401, "revenue": 1000, "region": "North"},
            {"month_id": 202402, "revenue": 1500, "region": "South"},
        ],
    )


@pytest.fixture
def sample_chart_suggestions():
    """Create sample chart suggestion response"""
    return [
        {
            "chart_type": "line",
            "x_column": "month_id",
            "y_column": "revenue",
            "title": "Revenue Over Time",
            "reasoning": "Shows revenue trend across months",
        },
        {
            "chart_type": "bar",
            "x_column": "region",
            "y_column": "revenue",
            "title": "Revenue by Region",
            "reasoning": "Compares revenue across regions",
        },
        {
            "chart_type": "pie",
            "category_column": "region",
            "value_column": "revenue",
            "title": "Revenue Distribution",
            "reasoning": "Shows revenue share by region",
        },
    ]


class TestAIAnalysisServiceInitialization:
    """Test suite for AIAnalysisService initialization"""

    @patch("app.services.ai_analysis_service.Anthropic")
    @patch("app.services.ai_analysis_service.settings")
    def test_init_with_api_key(self, mock_settings, mock_anthropic_class):
        """Test initialization with API key sets enabled=True"""
        mock_settings.anthropic_api_key = "test-key"
        mock_anthropic_class.return_value = Mock()

        service = AIAnalysisService()

        assert service.enabled is True
        assert service.client is not None
        mock_anthropic_class.assert_called_once_with(api_key="test-key")

    @patch("app.services.ai_analysis_service.settings")
    def test_init_without_api_key(self, mock_settings):
        """Test initialization without API key sets enabled=False"""
        mock_settings.anthropic_api_key = None

        service = AIAnalysisService()

        assert service.enabled is False
        assert service.client is None


class TestSuggestCharts:
    """Test suite for suggest_charts method"""

    @patch("app.services.ai_analysis_service.settings")
    def test_disabled_service_returns_empty_list(self, mock_settings, sample_schema):
        """Test that disabled service returns empty list"""
        mock_settings.anthropic_api_key = None
        service = AIAnalysisService()

        suggestions = service.suggest_charts(sample_schema)

        assert suggestions == []

    @patch("app.services.ai_analysis_service.Anthropic")
    @patch("app.services.ai_analysis_service.settings")
    def test_suggests_charts_successfully(
        self, mock_settings, mock_anthropic_class, sample_schema, sample_chart_suggestions
    ):
        """Test successful chart suggestion generation"""
        mock_settings.anthropic_api_key = "test-key"
        mock_client = Mock()
        mock_message = Mock()
        mock_message.content = [Mock(text=json.dumps(sample_chart_suggestions))]
        mock_client.messages.create.return_value = mock_message
        mock_anthropic_class.return_value = mock_client

        service = AIAnalysisService()
        suggestions = service.suggest_charts(sample_schema)

        assert len(suggestions) == 3
        assert suggestions[0]["chart_type"] == "line"
        assert suggestions[1]["chart_type"] == "bar"
        assert suggestions[2]["chart_type"] == "pie"

    @patch("app.services.ai_analysis_service.Anthropic")
    @patch("app.services.ai_analysis_service.settings")
    def test_includes_user_intent_in_prompt(
        self, mock_settings, mock_anthropic_class, sample_schema, sample_chart_suggestions
    ):
        """Test that user intent is included in the prompt"""
        mock_settings.anthropic_api_key = "test-key"
        mock_client = Mock()
        mock_message = Mock()
        mock_message.content = [Mock(text=json.dumps(sample_chart_suggestions))]
        mock_client.messages.create.return_value = mock_message
        mock_anthropic_class.return_value = mock_client

        service = AIAnalysisService()
        suggestions = service.suggest_charts(
            sample_schema, user_intent="Show me revenue trends by region"
        )

        # Verify the prompt includes user intent
        call_args = mock_client.messages.create.call_args
        prompt = call_args[1]["messages"][0]["content"]
        assert "Show me revenue trends by region" in prompt

    @patch("app.services.ai_analysis_service.Anthropic")
    @patch("app.services.ai_analysis_service.settings")
    def test_limits_to_four_charts(
        self, mock_settings, mock_anthropic_class, sample_schema
    ):
        """Test that suggestions are limited to 4 charts"""
        mock_settings.anthropic_api_key = "test-key"
        mock_client = Mock()
        mock_message = Mock()

        # Return 6 suggestions
        many_suggestions = [
            {"chart_type": "line", "title": f"Chart {i}", "reasoning": "test"}
            for i in range(6)
        ]
        mock_message.content = [Mock(text=json.dumps(many_suggestions))]
        mock_client.messages.create.return_value = mock_message
        mock_anthropic_class.return_value = mock_client

        service = AIAnalysisService()
        suggestions = service.suggest_charts(sample_schema)

        assert len(suggestions) == 4  # Limited to 4

    @patch("app.services.ai_analysis_service.Anthropic")
    @patch("app.services.ai_analysis_service.settings")
    def test_handles_invalid_json_response(
        self, mock_settings, mock_anthropic_class, sample_schema
    ):
        """Test that invalid JSON is handled gracefully"""
        mock_settings.anthropic_api_key = "test-key"
        mock_client = Mock()
        mock_message = Mock()
        mock_message.content = [Mock(text="This is not valid JSON")]
        mock_client.messages.create.return_value = mock_message
        mock_anthropic_class.return_value = mock_client

        service = AIAnalysisService()
        suggestions = service.suggest_charts(sample_schema)

        assert suggestions == []

    @patch("app.services.ai_analysis_service.Anthropic")
    @patch("app.services.ai_analysis_service.settings")
    def test_handles_empty_suggestions(
        self, mock_settings, mock_anthropic_class, sample_schema
    ):
        """Test that empty suggestions are handled"""
        mock_settings.anthropic_api_key = "test-key"
        mock_client = Mock()
        mock_message = Mock()
        mock_message.content = [Mock(text="[]")]
        mock_client.messages.create.return_value = mock_message
        mock_anthropic_class.return_value = mock_client

        service = AIAnalysisService()
        suggestions = service.suggest_charts(sample_schema)

        assert suggestions == []

    @patch("app.services.ai_analysis_service.Anthropic")
    @patch("app.services.ai_analysis_service.settings")
    def test_handles_api_error(self, mock_settings, mock_anthropic_class, sample_schema):
        """Test that API errors are handled gracefully"""
        mock_settings.anthropic_api_key = "test-key"
        mock_client = Mock()
        mock_client.messages.create.side_effect = Exception("API Error")
        mock_anthropic_class.return_value = mock_client

        service = AIAnalysisService()
        suggestions = service.suggest_charts(sample_schema)

        assert suggestions == []


class TestGenerateComparisonInsight:
    """Test suite for generate_comparison_insight method"""

    @patch("app.services.ai_analysis_service.settings")
    @pytest.mark.asyncio
    async def test_disabled_service_returns_default_message(self, mock_settings):
        """Test that disabled service returns default message"""
        mock_settings.anthropic_api_key = None
        service = AIAnalysisService()

        metrics = {"row_count_a": 100, "row_count_b": 150, "row_count_pct_change": 50.0}
        insight = await service.generate_comparison_insight(
            "file_a.csv", "file_b.csv", metrics, "side_by_side"
        )

        assert "Comparison between file_a.csv and file_b.csv" in insight

    @patch("app.services.ai_analysis_service.Anthropic")
    @patch("app.services.ai_analysis_service.settings")
    @pytest.mark.asyncio
    async def test_generates_comparison_insight_successfully(
        self, mock_settings, mock_anthropic_class
    ):
        """Test successful comparison insight generation"""
        mock_settings.anthropic_api_key = "test-key"
        mock_client = Mock()
        mock_message = Mock()
        mock_message.content = [
            Mock(text="Revenue increased by 50% from file A to file B, indicating strong growth.")
        ]
        mock_client.messages.create.return_value = mock_message
        mock_anthropic_class.return_value = mock_client

        service = AIAnalysisService()
        metrics = {
            "row_count_a": 100,
            "row_count_b": 150,
            "row_count_pct_change": 50.0,
            "numeric_columns": {
                "revenue": {
                    "mean_a": 1000,
                    "mean_b": 1500,
                    "pct_change": 50.0,
                }
            },
        }

        insight = await service.generate_comparison_insight(
            "Q1_sales.csv", "Q2_sales.csv", metrics, "trend"
        )

        assert "Revenue increased by 50%" in insight
        assert "strong growth" in insight

    @patch("app.services.ai_analysis_service.Anthropic")
    @patch("app.services.ai_analysis_service.settings")
    @pytest.mark.asyncio
    async def test_includes_metrics_in_prompt(self, mock_settings, mock_anthropic_class):
        """Test that metrics are included in the prompt"""
        mock_settings.anthropic_api_key = "test-key"
        mock_client = Mock()
        mock_message = Mock()
        mock_message.content = [Mock(text="Test insight")]
        mock_client.messages.create.return_value = mock_message
        mock_anthropic_class.return_value = mock_client

        service = AIAnalysisService()
        metrics = {
            "row_count_a": 100,
            "row_count_b": 150,
            "row_count_pct_change": 50.0,
            "numeric_columns": {"revenue": {"mean_a": 1000, "mean_b": 1500}},
        }

        await service.generate_comparison_insight(
            "file_a.csv", "file_b.csv", metrics, "yoy"
        )

        # Verify metrics are in the prompt
        call_args = mock_client.messages.create.call_args
        prompt = call_args[1]["messages"][0]["content"]
        assert "100" in prompt  # row_count_a
        assert "150" in prompt  # row_count_b
        assert "50.0" in prompt  # pct_change

    @patch("app.services.ai_analysis_service.Anthropic")
    @patch("app.services.ai_analysis_service.settings")
    @pytest.mark.asyncio
    async def test_handles_api_error_gracefully(self, mock_settings, mock_anthropic_class):
        """Test that API errors return fallback message"""
        mock_settings.anthropic_api_key = "test-key"
        mock_client = Mock()
        mock_client.messages.create.side_effect = Exception("API Error")
        mock_anthropic_class.return_value = mock_client

        service = AIAnalysisService()
        metrics = {"row_count_a": 100, "row_count_b": 150}

        insight = await service.generate_comparison_insight(
            "file_a.csv", "file_b.csv", metrics, "trend"
        )

        assert "Comparison between file_a.csv and file_b.csv" in insight
        assert "data differences" in insight


class TestGenerateChartComparisonInsight:
    """Test suite for generate_chart_comparison_insight method"""

    @patch("app.services.ai_analysis_service.settings")
    @pytest.mark.asyncio
    async def test_disabled_service_returns_none(self, mock_settings):
        """Test that disabled service returns None"""
        mock_settings.anthropic_api_key = None
        service = AIAnalysisService()

        mock_chart = Mock(
            title="Revenue Comparison",
            chart_type="line",
            file_a_name="Q1",
            file_b_name="Q2",
            x_column="month",
            y_column="revenue",
        )
        metrics = {"numeric_columns": {"revenue": {"mean_a": 1000, "mean_b": 1500}}}

        insight = await service.generate_chart_comparison_insight(mock_chart, metrics)

        assert insight is None

    @patch("app.services.ai_analysis_service.Anthropic")
    @patch("app.services.ai_analysis_service.settings")
    @pytest.mark.asyncio
    async def test_generates_chart_insight_successfully(
        self, mock_settings, mock_anthropic_class
    ):
        """Test successful chart comparison insight generation"""
        mock_settings.anthropic_api_key = "test-key"
        mock_client = Mock()
        mock_message = Mock()
        mock_message.content = [Mock(text="Revenue shows steady upward trend from Q1 to Q2.")]
        mock_client.messages.create.return_value = mock_message
        mock_anthropic_class.return_value = mock_client

        service = AIAnalysisService()
        mock_chart = Mock(
            title="Revenue Comparison",
            chart_type="line",
            file_a_name="Q1_sales.csv",
            file_b_name="Q2_sales.csv",
            x_column="month",
            y_column="revenue",
        )
        metrics = {
            "numeric_columns": {
                "revenue": {
                    "mean_a": 1000,
                    "mean_b": 1500,
                    "pct_change": 50.0,
                }
            }
        }

        insight = await service.generate_chart_comparison_insight(mock_chart, metrics)

        assert "Revenue shows steady upward trend" in insight

    @patch("app.services.ai_analysis_service.Anthropic")
    @patch("app.services.ai_analysis_service.settings")
    @pytest.mark.asyncio
    async def test_handles_api_error_returns_none(
        self, mock_settings, mock_anthropic_class
    ):
        """Test that API errors return None"""
        mock_settings.anthropic_api_key = "test-key"
        mock_client = Mock()
        mock_client.messages.create.side_effect = Exception("API Error")
        mock_anthropic_class.return_value = mock_client

        service = AIAnalysisService()
        mock_chart = Mock(
            title="Test Chart",
            chart_type="bar",
            file_a_name="A",
            file_b_name="B",
            x_column="x",
            y_column="y",
        )
        metrics = {"numeric_columns": {"y": {}}}

        insight = await service.generate_chart_comparison_insight(mock_chart, metrics)

        assert insight is None


class TestBuildChartSuggestionPrompt:
    """Test suite for _build_chart_suggestion_prompt method"""

    @patch("app.services.ai_analysis_service.settings")
    def test_builds_prompt_with_schema(self, mock_settings, sample_schema):
        """Test that prompt includes schema information"""
        mock_settings.anthropic_api_key = "test-key"

        with patch("app.services.ai_analysis_service.Anthropic"):
            service = AIAnalysisService()
            prompt = service._build_chart_suggestion_prompt(sample_schema, None)

            assert "month_id" in prompt
            assert "revenue" in prompt
            assert "region" in prompt
            assert "60" in prompt  # row count

    @patch("app.services.ai_analysis_service.settings")
    def test_includes_user_intent_when_provided(self, mock_settings, sample_schema):
        """Test that user intent is included in prompt"""
        mock_settings.anthropic_api_key = "test-key"

        with patch("app.services.ai_analysis_service.Anthropic"):
            service = AIAnalysisService()
            prompt = service._build_chart_suggestion_prompt(
                sample_schema, "Show revenue by region"
            )

            assert "Show revenue by region" in prompt
            assert "User Intent:" in prompt

    @patch("app.services.ai_analysis_service.settings")
    def test_includes_column_details(self, mock_settings, sample_schema):
        """Test that column details are included"""
        mock_settings.anthropic_api_key = "test-key"

        with patch("app.services.ai_analysis_service.Anthropic"):
            service = AIAnalysisService()
            prompt = service._build_chart_suggestion_prompt(sample_schema, None)

            # Check for numeric column details
            assert "202401" in prompt or "range" in prompt.lower()
            # Check for categorical details
            assert "5 unique values" in prompt or "unique" in prompt.lower()
