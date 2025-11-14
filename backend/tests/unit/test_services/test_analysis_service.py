"""Tests for AnalysisService - TDD approach for Phase 2.3."""

from unittest.mock import MagicMock, Mock, patch

import pandas as pd
import pytest

from app.models.schemas import ChartData, ColumnInfo, DataSchema
from app.services.analysis_service import AnalysisService

# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def sample_dataframe():
    """Create a sample dataframe for testing."""
    return pd.DataFrame(
        {
            "date": pd.date_range("2024-01-01", periods=10),
            "revenue": [100, 150, 120, 180, 200, 190, 220, 240, 230, 250],
            "category": ["A", "B", "A", "B", "A", "B", "A", "B", "A", "B"],
            "quantity": [10, 15, 12, 18, 20, 19, 22, 24, 23, 25],
        }
    )


@pytest.fixture
def sample_schema():
    """Create a sample schema for testing."""
    return DataSchema(
        row_count=10,
        columns=[
            ColumnInfo(name="date", type="datetime", null_count=0, sample_values=["2024-01-01"]),
            ColumnInfo(name="revenue", type="numeric", null_count=0, sample_values=["100"]),
            ColumnInfo(name="category", type="categorical", null_count=0, sample_values=["A", "B"]),
            ColumnInfo(name="quantity", type="numeric", null_count=0, sample_values=["10"]),
        ],
        preview=[],
    )


@pytest.fixture
def sample_chart():
    """Create a sample chart for testing."""
    return ChartData(
        title="Revenue Over Time",
        chart_type="line",
        data=[{"x": "2024-01-01", "y": 100}],
        priority=1,
        x_column="date",
        y_column="revenue",
    )


# ============================================================================
# TestAnalysisServiceInit
# ============================================================================


class TestAnalysisServiceInit:
    """Test AnalysisService initialization."""

    def test_initializes_with_dependencies(self):
        """Test that AnalysisService can be initialized with mock dependencies."""
        mock_chart_gen = Mock()
        mock_ai_service = Mock()

        service = AnalysisService(chart_generator=mock_chart_gen, ai_service=mock_ai_service)

        assert service.chart_generator == mock_chart_gen
        assert service.ai_service == mock_ai_service

    def test_initializes_with_default_dependencies(self):
        """Test that AnalysisService creates default dependencies if not provided."""
        service = AnalysisService()

        # Should create its own instances
        assert service.chart_generator is not None
        assert service.ai_service is not None


# ============================================================================
# TestAnalysisServiceGenerateCharts
# ============================================================================


class TestAnalysisServiceGenerateCharts:
    """Test chart generation with AI and heuristics fallback."""

    def test_generate_charts_uses_ai_when_enabled(self, sample_dataframe, sample_schema):
        """Test that AI chart suggestions are used when AI is enabled."""
        # Setup mocks
        mock_chart_gen = Mock()
        mock_ai_service = Mock()
        mock_ai_service.enabled = True

        # Mock AI suggestions
        ai_suggestions = [
            {"chart_type": "line", "title": "Revenue Trend", "x_col": "date", "y_col": "revenue"}
        ]
        mock_ai_service.suggest_charts.return_value = ai_suggestions

        # Mock chart generation from suggestions
        mock_charts = [{"title": "Revenue Trend", "chart_type": "line", "data": [], "priority": 1}]
        mock_chart_gen.generate_charts_from_suggestions.return_value = mock_charts

        service = AnalysisService(chart_generator=mock_chart_gen, ai_service=mock_ai_service)

        # Execute
        charts = service.generate_charts(sample_dataframe, sample_schema)

        # Verify AI was called
        mock_ai_service.suggest_charts.assert_called_once_with(sample_schema, None)
        mock_chart_gen.generate_charts_from_suggestions.assert_called_once()
        assert len(charts) == 1
        assert charts[0].title == "Revenue Trend"

    def test_generate_charts_uses_ai_with_user_intent(self, sample_dataframe, sample_schema):
        """Test that user intent is passed to AI chart suggestions."""
        mock_chart_gen = Mock()
        mock_ai_service = Mock()
        mock_ai_service.enabled = True

        ai_suggestions = [{"chart_type": "bar", "title": "Sales Analysis"}]
        mock_ai_service.suggest_charts.return_value = ai_suggestions
        mock_chart_gen.generate_charts_from_suggestions.return_value = [
            {"title": "Sales Analysis", "chart_type": "bar", "data": [], "priority": 1}
        ]

        service = AnalysisService(chart_generator=mock_chart_gen, ai_service=mock_ai_service)

        # Execute with user intent
        charts = service.generate_charts(
            sample_dataframe, sample_schema, user_intent="Show me sales trends"
        )

        # Verify user intent was passed
        mock_ai_service.suggest_charts.assert_called_once_with(
            sample_schema, "Show me sales trends"
        )

    def test_generate_charts_falls_back_to_heuristics_when_ai_disabled(
        self, sample_dataframe, sample_schema
    ):
        """Test that heuristics are used when AI is disabled."""
        mock_chart_gen = Mock()
        mock_ai_service = Mock()
        mock_ai_service.enabled = False

        # Mock heuristic charts
        heuristic_charts = [
            {"title": "Heuristic Chart", "chart_type": "line", "data": [], "priority": 1}
        ]
        mock_chart_gen.generate_charts.return_value = heuristic_charts

        service = AnalysisService(chart_generator=mock_chart_gen, ai_service=mock_ai_service)

        # Execute
        charts = service.generate_charts(sample_dataframe, sample_schema)

        # Verify heuristics were used, not AI
        mock_ai_service.suggest_charts.assert_not_called()
        mock_chart_gen.generate_charts.assert_called_once_with(
            sample_dataframe, sample_schema, max_charts=4
        )
        assert len(charts) == 1

    def test_generate_charts_falls_back_when_ai_returns_empty(
        self, sample_dataframe, sample_schema
    ):
        """Test fallback to heuristics when AI returns no suggestions."""
        mock_chart_gen = Mock()
        mock_ai_service = Mock()
        mock_ai_service.enabled = True
        mock_ai_service.suggest_charts.return_value = []  # Empty suggestions

        # Mock heuristic fallback
        heuristic_charts = [
            {"title": "Fallback Chart", "chart_type": "bar", "data": [], "priority": 1}
        ]
        mock_chart_gen.generate_charts.return_value = heuristic_charts

        service = AnalysisService(chart_generator=mock_chart_gen, ai_service=mock_ai_service)

        # Execute
        charts = service.generate_charts(sample_dataframe, sample_schema)

        # Verify fallback to heuristics
        mock_chart_gen.generate_charts.assert_called_once()
        assert charts[0].title == "Fallback Chart"

    def test_generate_charts_falls_back_when_ai_raises_exception(
        self, sample_dataframe, sample_schema
    ):
        """Test graceful fallback when AI service raises an exception."""
        mock_chart_gen = Mock()
        mock_ai_service = Mock()
        mock_ai_service.enabled = True
        mock_ai_service.suggest_charts.side_effect = Exception("AI API error")

        # Mock heuristic fallback
        heuristic_charts = [
            {"title": "Error Fallback", "chart_type": "line", "data": [], "priority": 1}
        ]
        mock_chart_gen.generate_charts.return_value = heuristic_charts

        service = AnalysisService(chart_generator=mock_chart_gen, ai_service=mock_ai_service)

        # Execute - should not raise, should fallback
        charts = service.generate_charts(sample_dataframe, sample_schema)

        # Verify fallback occurred
        mock_chart_gen.generate_charts.assert_called_once()
        assert charts[0].title == "Error Fallback"

    def test_generate_charts_respects_max_charts_parameter(self, sample_dataframe, sample_schema):
        """Test that max_charts parameter is respected in heuristics mode."""
        mock_chart_gen = Mock()
        mock_ai_service = Mock()
        mock_ai_service.enabled = False

        mock_chart_gen.generate_charts.return_value = []

        service = AnalysisService(chart_generator=mock_chart_gen, ai_service=mock_ai_service)

        # Execute with custom max_charts
        service.generate_charts(sample_dataframe, sample_schema, max_charts=6)

        # Verify max_charts was passed
        mock_chart_gen.generate_charts.assert_called_once_with(
            sample_dataframe, sample_schema, max_charts=6
        )


# ============================================================================
# TestAnalysisServiceAddInsights
# ============================================================================


class TestAnalysisServiceAddInsights:
    """Test adding AI insights to charts."""

    def test_add_insights_to_charts_when_ai_enabled(self, sample_schema):
        """Test that insights are added to charts when AI is enabled."""
        mock_ai_service = Mock()
        mock_ai_service.enabled = True
        mock_ai_service.generate_chart_insight.return_value = "This chart shows revenue growth."

        service = AnalysisService(ai_service=mock_ai_service)

        # Create sample charts
        charts = [
            ChartData(title="Chart 1", chart_type="line", data=[], priority=1),
            ChartData(title="Chart 2", chart_type="bar", data=[], priority=2),
        ]

        # Execute
        charts_with_insights = service.add_insights_to_charts(charts, sample_schema)

        # Verify insights were added
        assert len(charts_with_insights) == 2
        assert charts_with_insights[0].insight == "This chart shows revenue growth."
        assert charts_with_insights[1].insight == "This chart shows revenue growth."
        assert mock_ai_service.generate_chart_insight.call_count == 2

    def test_add_insights_skips_when_ai_disabled(self, sample_schema):
        """Test that insights are not added when AI is disabled."""
        mock_ai_service = Mock()
        mock_ai_service.enabled = False

        service = AnalysisService(ai_service=mock_ai_service)

        charts = [ChartData(title="Chart 1", chart_type="line", data=[], priority=1)]

        # Execute
        charts_with_insights = service.add_insights_to_charts(charts, sample_schema)

        # Verify no insights added
        assert len(charts_with_insights) == 1
        assert charts_with_insights[0].insight is None
        mock_ai_service.generate_chart_insight.assert_not_called()

    def test_add_insights_handles_empty_chart_list(self, sample_schema):
        """Test that empty chart list is handled gracefully."""
        mock_ai_service = Mock()
        mock_ai_service.enabled = True

        service = AnalysisService(ai_service=mock_ai_service)

        # Execute with empty list
        charts_with_insights = service.add_insights_to_charts([], sample_schema)

        # Verify empty list returned
        assert charts_with_insights == []
        mock_ai_service.generate_chart_insight.assert_not_called()

    def test_add_insights_continues_on_individual_failure(self, sample_schema):
        """Test that insight generation continues even if one chart fails."""
        mock_ai_service = Mock()
        mock_ai_service.enabled = True

        # First chart fails, second succeeds
        mock_ai_service.generate_chart_insight.side_effect = [
            Exception("API error"),
            "Insight for chart 2",
        ]

        service = AnalysisService(ai_service=mock_ai_service)

        charts = [
            ChartData(title="Chart 1", chart_type="line", data=[], priority=1),
            ChartData(title="Chart 2", chart_type="bar", data=[], priority=1),
        ]

        # Execute - should not raise
        charts_with_insights = service.add_insights_to_charts(charts, sample_schema)

        # Verify both charts returned, first without insight
        assert len(charts_with_insights) == 2
        assert charts_with_insights[0].insight is None  # Failed
        assert charts_with_insights[1].insight == "Insight for chart 2"  # Success


# ============================================================================
# TestAnalysisServiceGenerateGlobalSummary
# ============================================================================


class TestAnalysisServiceGenerateGlobalSummary:
    """Test global summary generation."""

    def test_generate_global_summary_when_ai_enabled(self, sample_schema):
        """Test that global summary is generated when AI is enabled."""
        mock_ai_service = Mock()
        mock_ai_service.enabled = True
        mock_ai_service.generate_global_summary.return_value = (
            "Overall, revenue is trending upward."
        )

        service = AnalysisService(ai_service=mock_ai_service)

        charts = [ChartData(title="Chart 1", chart_type="line", data=[], priority=1)]

        # Execute
        summary = service.generate_global_summary(charts, sample_schema)

        # Verify
        assert summary == "Overall, revenue is trending upward."
        mock_ai_service.generate_global_summary.assert_called_once_with(
            charts, sample_schema, user_intent=None
        )

    def test_generate_global_summary_with_user_intent(self, sample_schema):
        """Test that user intent is passed to global summary generation."""
        mock_ai_service = Mock()
        mock_ai_service.enabled = True
        mock_ai_service.generate_global_summary.return_value = "Sales trends are positive."

        service = AnalysisService(ai_service=mock_ai_service)

        charts = [ChartData(title="Chart 1", chart_type="line", data=[], priority=1)]

        # Execute with user intent
        summary = service.generate_global_summary(
            charts, sample_schema, user_intent="Show sales trends"
        )

        # Verify user intent was passed
        mock_ai_service.generate_global_summary.assert_called_once_with(
            charts, sample_schema, user_intent="Show sales trends"
        )

    def test_generate_global_summary_returns_none_when_ai_disabled(self, sample_schema):
        """Test that None is returned when AI is disabled."""
        mock_ai_service = Mock()
        mock_ai_service.enabled = False

        service = AnalysisService(ai_service=mock_ai_service)

        charts = [ChartData(title="Chart 1", chart_type="line", data=[], priority=1)]

        # Execute
        summary = service.generate_global_summary(charts, sample_schema)

        # Verify None returned
        assert summary is None
        mock_ai_service.generate_global_summary.assert_not_called()

    def test_generate_global_summary_returns_none_on_exception(self, sample_schema):
        """Test that None is returned when AI raises an exception."""
        mock_ai_service = Mock()
        mock_ai_service.enabled = True
        mock_ai_service.generate_global_summary.side_effect = Exception("AI API error")

        service = AnalysisService(ai_service=mock_ai_service)

        charts = [ChartData(title="Chart 1", chart_type="line", data=[], priority=1)]

        # Execute - should not raise
        summary = service.generate_global_summary(charts, sample_schema)

        # Verify None returned (graceful degradation)
        assert summary is None

    def test_generate_global_summary_handles_empty_charts(self, sample_schema):
        """Test that empty charts list is handled gracefully."""
        mock_ai_service = Mock()
        mock_ai_service.enabled = True

        service = AnalysisService(ai_service=mock_ai_service)

        # Execute with empty charts
        summary = service.generate_global_summary([], sample_schema)

        # Should still attempt to generate summary
        mock_ai_service.generate_global_summary.assert_called_once()


# ============================================================================
# TestAnalysisServicePerformFullAnalysis
# ============================================================================


class TestAnalysisServicePerformFullAnalysis:
    """Test full analysis workflow (charts + insights + summary)."""

    def test_perform_full_analysis_success(self, sample_dataframe, sample_schema):
        """Test complete analysis workflow with all features."""
        mock_chart_gen = Mock()
        mock_ai_service = Mock()
        mock_ai_service.enabled = True

        # Mock chart generation
        mock_charts = [
            {"title": "Chart 1", "chart_type": "line", "data": [], "priority": 1},
            {"title": "Chart 2", "chart_type": "bar", "data": [], "priority": 1},
        ]
        mock_chart_gen.generate_charts.return_value = mock_charts

        # Mock insights
        mock_ai_service.generate_chart_insight.return_value = "Chart insight"

        # Mock global summary
        mock_ai_service.generate_global_summary.return_value = "Global summary"

        service = AnalysisService(chart_generator=mock_chart_gen, ai_service=mock_ai_service)

        # Execute full analysis
        result = service.perform_full_analysis(sample_dataframe, sample_schema)

        # Verify result structure
        assert "charts" in result
        assert "global_summary" in result
        assert len(result["charts"]) == 2
        assert result["global_summary"] == "Global summary"

        # Verify all charts have insights
        for chart in result["charts"]:
            assert chart.insight == "Chart insight"

    def test_perform_full_analysis_without_ai(self, sample_dataframe, sample_schema):
        """Test full analysis when AI is disabled (charts only)."""
        mock_chart_gen = Mock()
        mock_ai_service = Mock()
        mock_ai_service.enabled = False

        mock_charts = [{"title": "Chart 1", "chart_type": "line", "data": [], "priority": 1}]
        mock_chart_gen.generate_charts.return_value = mock_charts

        service = AnalysisService(chart_generator=mock_chart_gen, ai_service=mock_ai_service)

        # Execute
        result = service.perform_full_analysis(sample_dataframe, sample_schema)

        # Verify charts without insights/summary
        assert len(result["charts"]) == 1
        assert result["global_summary"] is None
        assert result["charts"][0].insight is None
