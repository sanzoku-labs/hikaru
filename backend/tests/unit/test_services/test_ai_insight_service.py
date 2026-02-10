"""
Unit tests for AIInsightService.

Tests AI-powered insight generation with mocked Anthropic API.
"""
from unittest.mock import Mock, patch

import pytest

from app.models.schemas import ChartData, ColumnInfo, DataSchema
from app.services.ai_insight_service import AIInsightService
from app.services.cache_service import CacheService


@pytest.fixture
def mock_anthropic_client():
    """Create a mock Anthropic client"""
    mock_client = Mock()
    mock_message = Mock()
    mock_message.content = [Mock(text="This is a test insight from Claude.")]
    mock_client.messages.create.return_value = mock_message
    return mock_client


@pytest.fixture
def cache_service():
    """Create a mock cache service for testing"""
    # CacheService requires redis_client, so we'll mock it
    mock_redis = Mock()
    return CacheService(redis_client=mock_redis)


@pytest.fixture
def sample_chart_data():
    """Create sample chart data"""
    return ChartData(
        chart_type="line",
        title="Revenue Over Time",
        x_column="date",
        y_column="revenue",
        data=[
            {"x": "Jan", "y": 100},
            {"x": "Feb", "y": 150},
            {"x": "Mar", "y": 200},
        ],
        priority=1,
    )


@pytest.fixture
def sample_schema():
    """Create sample data schema"""
    return DataSchema(
        columns=[
            ColumnInfo(
                name="date",
                type="datetime",
                unique_values=12,
                null_count=0,
                sample_values=["2024-01", "2024-02", "2024-03"],
            ),
            ColumnInfo(
                name="revenue",
                type="numeric",
                unique_values=12,
                null_count=0,
                sample_values=[100, 150, 200],
                min=100,
                max=200,
                mean=150,
                median=150,
            ),
        ],
        row_count=3,
        preview=[],
    )


class TestAIInsightServiceInitialization:
    """Test suite for AIInsightService initialization"""

    @patch("app.services.ai_insight_service.Anthropic")
    @patch("app.services.ai_insight_service.settings")
    def test_init_with_api_key(self, mock_settings, mock_anthropic_class):
        """Test initialization with API key sets enabled=True"""
        mock_settings.anthropic_api_key = "test-key"
        mock_anthropic_class.return_value = Mock()

        service = AIInsightService()

        assert service.enabled is True
        assert service.client is not None
        mock_anthropic_class.assert_called_once_with(api_key="test-key")

    @patch("app.services.ai_insight_service.settings")
    def test_init_without_api_key(self, mock_settings):
        """Test initialization without API key sets enabled=False"""
        mock_settings.anthropic_api_key = None

        service = AIInsightService()

        assert service.enabled is False
        assert service.client is None

    def test_init_with_cache_service(self, cache_service):
        """Test initialization with cache service"""
        with patch("app.services.ai_insight_service.settings") as mock_settings:
            mock_settings.anthropic_api_key = None
            service = AIInsightService(cache_service=cache_service)

            assert service.cache is cache_service


class TestGenerateChartInsight:
    """Test suite for generate_chart_insight method"""

    @patch("app.services.ai_insight_service.settings")
    def test_disabled_service_returns_none(self, mock_settings, sample_chart_data, sample_schema):
        """Test that disabled service returns None"""
        mock_settings.anthropic_api_key = None
        service = AIInsightService()

        result = service.generate_chart_insight(sample_chart_data, sample_schema)

        assert result is None

    @patch("app.services.ai_insight_service.Anthropic")
    @patch("app.services.ai_insight_service.settings")
    def test_generates_insight_successfully(
        self, mock_settings, mock_anthropic_class, sample_chart_data, sample_schema
    ):
        """Test successful insight generation"""
        mock_settings.anthropic_api_key = "test-key"
        mock_client = Mock()
        mock_message = Mock()
        mock_message.content = [Mock(text="Revenue shows steady growth over the quarter.")]
        mock_client.messages.create.return_value = mock_message
        mock_anthropic_class.return_value = mock_client

        service = AIInsightService()
        result = service.generate_chart_insight(sample_chart_data, sample_schema)

        assert result == "Revenue shows steady growth over the quarter."
        mock_client.messages.create.assert_called_once()

    @patch("app.services.ai_insight_service.Anthropic")
    @patch("app.services.ai_insight_service.settings")
    def test_uses_cache_when_available(
        self,
        mock_settings,
        mock_anthropic_class,
        sample_chart_data,
        sample_schema,
    ):
        """Test that cached insights are returned"""
        mock_settings.anthropic_api_key = "test-key"
        mock_anthropic_class.return_value = Mock()

        # Create mock cache service
        mock_cache = Mock()
        mock_cache.chart_insight_key.return_value = "test_cache_key"
        mock_cache.get.return_value = "Cached insight"

        service = AIInsightService(cache_service=mock_cache)
        result = service.generate_chart_insight(sample_chart_data, sample_schema)

        assert result == "Cached insight"
        # Anthropic API should not be called
        service.client.messages.create.assert_not_called()

    @patch("app.services.ai_insight_service.Anthropic")
    @patch("app.services.ai_insight_service.settings")
    def test_caches_generated_insight(
        self,
        mock_settings,
        mock_anthropic_class,
        sample_chart_data,
        sample_schema,
    ):
        """Test that generated insights are cached"""
        mock_settings.anthropic_api_key = "test-key"
        mock_client = Mock()
        mock_message = Mock()
        mock_message.content = [Mock(text="Fresh insight from API")]
        mock_client.messages.create.return_value = mock_message
        mock_anthropic_class.return_value = mock_client

        # Create mock cache service
        mock_cache = Mock()
        mock_cache.chart_insight_key.return_value = "test_cache_key"
        mock_cache.get.return_value = None  # No cache hit

        service = AIInsightService(cache_service=mock_cache)
        result = service.generate_chart_insight(sample_chart_data, sample_schema)

        assert result == "Fresh insight from API"

        # Verify it was cached
        mock_cache.set.assert_called_once_with(
            "test_cache_key", "Fresh insight from API", ttl_hours=24
        )

    @patch("app.services.ai_insight_service.Anthropic")
    @patch("app.services.ai_insight_service.settings")
    def test_api_error_returns_none(
        self, mock_settings, mock_anthropic_class, sample_chart_data, sample_schema
    ):
        """Test that API errors are handled gracefully"""
        mock_settings.anthropic_api_key = "test-key"
        mock_client = Mock()
        mock_client.messages.create.side_effect = Exception("API Error")
        mock_anthropic_class.return_value = mock_client

        service = AIInsightService()
        result = service.generate_chart_insight(sample_chart_data, sample_schema)

        assert result is None


class TestGenerateGlobalSummary:
    """Test suite for generate_global_summary method"""

    @patch("app.services.ai_insight_service.settings")
    def test_disabled_service_returns_none(self, mock_settings, sample_chart_data, sample_schema):
        """Test that disabled service returns None"""
        mock_settings.anthropic_api_key = None
        service = AIInsightService()

        result = service.generate_global_summary([sample_chart_data], sample_schema)

        assert result is None

    @patch("app.services.ai_insight_service.Anthropic")
    @patch("app.services.ai_insight_service.settings")
    def test_generates_summary_successfully(
        self, mock_settings, mock_anthropic_class, sample_chart_data, sample_schema
    ):
        """Test successful summary generation"""
        mock_settings.anthropic_api_key = "test-key"
        mock_client = Mock()
        mock_message = Mock()
        mock_message.content = [Mock(text="The dataset shows revenue trends over 3 months.")]
        mock_client.messages.create.return_value = mock_message
        mock_anthropic_class.return_value = mock_client

        service = AIInsightService()
        result = service.generate_global_summary([sample_chart_data], sample_schema)

        assert result == "The dataset shows revenue trends over 3 months."
        mock_client.messages.create.assert_called_once()

    @patch("app.services.ai_insight_service.Anthropic")
    @patch("app.services.ai_insight_service.settings")
    def test_uses_cache_for_summary(
        self, mock_settings, mock_anthropic_class, sample_chart_data, sample_schema
    ):
        """Test that cached summaries are returned"""
        mock_settings.anthropic_api_key = "test-key"
        mock_anthropic_class.return_value = Mock()

        # Create mock cache service
        mock_cache = Mock()
        mock_cache.global_summary_key.return_value = "summary_cache_key"
        mock_cache.get.return_value = "Cached summary"

        service = AIInsightService(cache_service=mock_cache)
        result = service.generate_global_summary([sample_chart_data], sample_schema)

        assert result == "Cached summary"
        service.client.messages.create.assert_not_called()

    @patch("app.services.ai_insight_service.Anthropic")
    @patch("app.services.ai_insight_service.settings")
    def test_api_error_returns_none_for_summary(
        self, mock_settings, mock_anthropic_class, sample_chart_data, sample_schema
    ):
        """Test that API errors are handled gracefully"""
        mock_settings.anthropic_api_key = "test-key"
        mock_client = Mock()
        mock_client.messages.create.side_effect = Exception("API Error")
        mock_anthropic_class.return_value = mock_client

        service = AIInsightService()
        result = service.generate_global_summary([sample_chart_data], sample_schema)

        assert result is None


class TestBuildChartPrompt:
    """Test suite for _build_chart_prompt method"""

    @patch("app.services.ai_insight_service.settings")
    def test_builds_prompt_for_line_chart(self, mock_settings, sample_chart_data, sample_schema):
        """Test prompt building for line chart"""
        mock_settings.anthropic_api_key = "test-key"
        with patch("app.services.ai_insight_service.Anthropic"):
            service = AIInsightService()

            prompt = service._build_chart_prompt(sample_chart_data, sample_schema)

            assert "line" in prompt.lower()
            assert "Revenue Over Time" in prompt
            assert "revenue" in prompt.lower()

    @patch("app.services.ai_insight_service.settings")
    def test_includes_chart_data_in_prompt(self, mock_settings, sample_schema):
        """Test that chart data is included in prompt"""
        mock_settings.anthropic_api_key = "test-key"
        chart = ChartData(
            chart_type="bar",
            title="Sales by Region",
            x_column="region",
            y_column="sales",
            data=[{"category": "North", "value": 100}, {"category": "South", "value": 200}],
            priority=2,
        )

        with patch("app.services.ai_insight_service.Anthropic"):
            service = AIInsightService()
            prompt = service._build_chart_prompt(chart, sample_schema)

            assert "bar" in prompt.lower()
            assert "Sales by Region" in prompt


class TestBuildGlobalSummaryPrompt:
    """Test suite for _build_global_summary_prompt method"""

    @patch("app.services.ai_insight_service.settings")
    def test_builds_summary_prompt(self, mock_settings, sample_chart_data, sample_schema):
        """Test summary prompt building"""
        mock_settings.anthropic_api_key = "test-key"

        with patch("app.services.ai_insight_service.Anthropic"):
            service = AIInsightService()
            prompt = service._build_summary_prompt([sample_chart_data], sample_schema)

            assert str(sample_schema.row_count) in prompt
            assert "revenue" in prompt.lower()

    @patch("app.services.ai_insight_service.settings")
    def test_includes_column_information(self, mock_settings, sample_chart_data, sample_schema):
        """Test that column information is included"""
        mock_settings.anthropic_api_key = "test-key"

        with patch("app.services.ai_insight_service.Anthropic"):
            service = AIInsightService()
            prompt = service._build_summary_prompt([sample_chart_data], sample_schema)

            assert "date" in prompt.lower()
            assert "revenue" in prompt.lower()
            assert "numeric" in prompt.lower() or "datetime" in prompt.lower()


class TestFormatChartDataForPrompt:
    """Test suite for _format_chart_data_for_prompt method"""

    @patch("app.services.ai_insight_service.settings")
    def test_formats_simple_chart_data(self, mock_settings, sample_chart_data):
        """Test formatting of simple chart data"""
        mock_settings.anthropic_api_key = "test-key"

        with patch("app.services.ai_insight_service.Anthropic"):
            service = AIInsightService()
            formatted = service._format_chart_data(sample_chart_data)

            assert isinstance(formatted, str)
            assert "Jan" in formatted or "Feb" in formatted or "Mar" in formatted

    @patch("app.services.ai_insight_service.settings")
    def test_handles_complex_chart_data(self, mock_settings):
        """Test formatting of complex chart data with multiple datasets"""
        mock_settings.anthropic_api_key = "test-key"
        chart = ChartData(
            chart_type="line",
            title="Multi-Series",
            x_column="quarter",
            y_column="value",
            data=[
                {"x": "Q1", "y": 10},
                {"x": "Q2", "y": 20},
            ],
            priority=1,
        )

        with patch("app.services.ai_insight_service.Anthropic"):
            service = AIInsightService()
            formatted = service._format_chart_data(chart)

            assert "Q1" in formatted or "Q2" in formatted


class TestFormatChartDataHelpers:
    """Test suite for chart data formatting helper methods"""

    @patch("app.services.ai_insight_service.settings")
    def test_format_pie_data(self, mock_settings):
        """Test formatting pie chart data with percentages"""
        mock_settings.anthropic_api_key = "test-key"

        chart = ChartData(
            chart_type="pie",
            title="Revenue by Region",
            category_column="region",
            value_column="revenue",
            data=[
                {"name": "North", "value": 5000},
                {"name": "South", "value": 3000},
                {"name": "East", "value": 2000},
            ],
            priority=1,
        )

        with patch("app.services.ai_insight_service.Anthropic"):
            service = AIInsightService()
            formatted = service._format_pie_data(chart)

            assert "North" in formatted
            assert "5,000" in formatted
            assert "50.0%" in formatted  # 5000/10000 = 50%
            assert "Total: 10,000" in formatted

    @patch("app.services.ai_insight_service.settings")
    def test_format_bar_data(self, mock_settings):
        """Test formatting bar chart data"""
        mock_settings.anthropic_api_key = "test-key"

        chart = ChartData(
            chart_type="bar",
            title="Sales by Product",
            x_column="product",
            y_column="sales",
            data=[
                {"category": "Product A", "value": 1000},
                {"category": "Product B", "value": 1500},
                {"category": "Product C", "value": 800},
            ],
            priority=1,
        )

        with patch("app.services.ai_insight_service.Anthropic"):
            service = AIInsightService()
            formatted = service._format_bar_data(chart)

            assert "Product A" in formatted
            assert "1,000" in formatted
            assert "Product B" in formatted
            assert "1,500" in formatted

    @patch("app.services.ai_insight_service.settings")
    def test_format_line_data_short(self, mock_settings):
        """Test formatting line chart data with few points"""
        mock_settings.anthropic_api_key = "test-key"

        chart = ChartData(
            chart_type="line",
            title="Revenue Over Time",
            x_column="month",
            y_column="revenue",
            data=[
                {"x": "Jan", "y": 100},
                {"x": "Feb", "y": 150},
                {"x": "Mar", "y": 200},
            ],
            priority=1,
        )

        with patch("app.services.ai_insight_service.Anthropic"):
            service = AIInsightService()
            formatted = service._format_line_data(chart)

            assert "Jan" in formatted
            assert "100" in formatted
            assert "Statistics" in formatted
            assert "Total=" in formatted

    @patch("app.services.ai_insight_service.settings")
    def test_format_line_data_long(self, mock_settings):
        """Test formatting line chart data with many points (sampling)"""
        mock_settings.anthropic_api_key = "test-key"

        # Create chart with 30 data points
        data = [{"x": f"Day{i}", "y": i * 10} for i in range(30)]

        chart = ChartData(
            chart_type="line",
            title="Daily Revenue",
            x_column="day",
            y_column="revenue",
            data=data,
            priority=1,
        )

        with patch("app.services.ai_insight_service.Anthropic"):
            service = AIInsightService()
            formatted = service._format_line_data(chart)

            # Should show sample with first and last 5
            assert "sample" in formatted.lower()
            assert "First 5 points" in formatted
            assert "Last 5 points" in formatted
            assert "Day0" in formatted  # First
            assert "Day29" in formatted  # Last

    @patch("app.services.ai_insight_service.settings")
    def test_format_scatter_data(self, mock_settings):
        """Test formatting scatter plot data"""
        mock_settings.anthropic_api_key = "test-key"

        chart = ChartData(
            chart_type="scatter",
            title="Price vs Quantity",
            x_column="price",
            y_column="quantity",
            data=[
                {"x": 10.5, "y": 100},
                {"x": 15.2, "y": 80},
                {"x": 20.1, "y": 60},
                {"x": 25.8, "y": 40},
            ],
            priority=1,
        )

        with patch("app.services.ai_insight_service.Anthropic"):
            service = AIInsightService()
            formatted = service._format_scatter_data(chart)

            assert "10.50" in formatted
            assert "100" in formatted
            assert "X-axis:" in formatted
            assert "Y-axis:" in formatted
            assert "Total points: 4" in formatted
