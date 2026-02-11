"""
Unit tests for query API route.
"""
from datetime import datetime
from unittest.mock import Mock, patch

import pandas as pd
import pytest
from fastapi import HTTPException

from app.api.routes.query import _generate_chart_from_config, query_data
from app.models.schemas import ColumnInfo, DataSchema, QueryRequest


@pytest.fixture
def mock_db():
    """Mock database session"""
    return Mock()


@pytest.fixture
def sample_upload_data():
    """Sample upload data"""
    df = pd.DataFrame(
        {
            "month": ["Jan", "Feb", "Mar"],
            "revenue": [100, 150, 200],
            "category": ["A", "B", "A"],
        }
    )

    schema = DataSchema(
        columns=[
            ColumnInfo(
                name="month",
                type="categorical",
                unique_values=3,
                null_count=0,
                sample_values=["Jan", "Feb"],
            ),
            ColumnInfo(
                name="revenue",
                type="numeric",
                unique_values=3,
                null_count=0,
                sample_values=[100, 150],
                min=100,
                max=200,
                mean=150,
                median=150,
            ),
            ColumnInfo(
                name="category",
                type="categorical",
                unique_values=2,
                null_count=0,
                sample_values=["A", "B"],
            ),
        ],
        row_count=3,
        preview=[],
    )

    return {
        "dataframe": df,
        "schema": schema,
        "filename": "test.csv",
        "timestamp": datetime.now().isoformat(),
    }


@pytest.mark.asyncio
async def test_query_data_text_response(mock_db, sample_upload_data):
    """Test query with text-only response"""
    with patch("app.api.routes.query.UploadService") as mock_upload_service_class:
        with patch("app.api.routes.query.AIService") as mock_ai_service_class:
            # Setup mocks
            mock_upload_service = Mock()
            mock_upload_service.get_upload.return_value = sample_upload_data
            mock_upload_service_class.return_value = mock_upload_service

            mock_ai_service = Mock()
            mock_ai_service.enabled = True
            mock_ai_service.generate_query_response.return_value = (
                "The revenue is $450 total.",
                "conv-123",
                None,  # No chart config
            )
            mock_ai_service_class.return_value = mock_ai_service

            # Call endpoint
            request = QueryRequest(upload_id="test-123", question="What is total revenue?")
            result = await query_data(request, db=mock_db)

            # Verify
            assert result.answer == "The revenue is $450 total."
            assert result.conversation_id == "conv-123"
            assert result.chart is None


@pytest.mark.asyncio
async def test_query_data_with_chart_generation(mock_db, sample_upload_data):
    """Test query that generates a chart"""
    with patch("app.api.routes.query.UploadService") as mock_upload_service_class:
        with patch("app.api.routes.query.AIService") as mock_ai_service_class:
            with patch("app.api.routes.query._generate_chart_from_config") as mock_chart_gen:
                # Setup mocks
                mock_upload_service = Mock()
                mock_upload_service.get_upload.return_value = sample_upload_data
                mock_upload_service_class.return_value = mock_upload_service

                mock_ai_service = Mock()
                mock_ai_service.enabled = True
                chart_config = {
                    "chart_type": "bar",
                    "category_column": "category",
                    "value_column": "revenue",
                }
                mock_ai_service.generate_query_response.return_value = (
                    "Here's a chart showing revenue by category.",
                    "conv-123",
                    chart_config,
                )
                mock_ai_service_class.return_value = mock_ai_service

                # Mock chart generation
                from app.models.schemas import ChartData

                mock_chart = ChartData(
                    chart_type="bar",
                    title="Test Chart",
                    x_column="category",
                    y_column="revenue",
                    data=[{"category": "A", "value": 100}],
                    priority=1,
                )
                mock_chart_gen.return_value = mock_chart

                # Call endpoint
                request = QueryRequest(upload_id="test-123", question="Show revenue by category")
                result = await query_data(request, db=mock_db)

                # Verify
                assert result.chart is not None
                assert result.chart.chart_type == "bar"


@pytest.mark.asyncio
async def test_query_data_ai_disabled(mock_db, sample_upload_data):
    """Test query when AI service is disabled"""
    with patch("app.api.routes.query.UploadService") as mock_upload_service_class:
        with patch("app.api.routes.query.AIService") as mock_ai_service_class:
            # Setup mocks
            mock_upload_service = Mock()
            mock_upload_service.get_upload.return_value = sample_upload_data
            mock_upload_service_class.return_value = mock_upload_service

            mock_ai_service = Mock()
            mock_ai_service.enabled = False  # AI disabled
            mock_ai_service_class.return_value = mock_ai_service

            # Call endpoint
            request = QueryRequest(upload_id="test-123", question="What is the revenue?")

            # Should raise HTTPException
            with pytest.raises(HTTPException) as exc_info:
                await query_data(request, db=mock_db)

            assert exc_info.value.status_code == 503
            assert "not available" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_query_data_chart_generation_fails_gracefully(mock_db, sample_upload_data):
    """Test that chart generation failure doesn't crash the endpoint"""
    with patch("app.api.routes.query.UploadService") as mock_upload_service_class:
        with patch("app.api.routes.query.AIService") as mock_ai_service_class:
            with patch("app.api.routes.query._generate_chart_from_config") as mock_chart_gen:
                # Setup mocks
                mock_upload_service = Mock()
                mock_upload_service.get_upload.return_value = sample_upload_data
                mock_upload_service_class.return_value = mock_upload_service

                mock_ai_service = Mock()
                mock_ai_service.enabled = True
                mock_ai_service.generate_query_response.return_value = (
                    "Answer text",
                    "conv-123",
                    {"chart_type": "invalid"},
                )
                mock_ai_service_class.return_value = mock_ai_service

                # Chart generation fails
                mock_chart_gen.side_effect = Exception("Chart generation failed")

                # Call endpoint - should not crash
                request = QueryRequest(upload_id="test-123", question="Show chart")
                result = await query_data(request, db=mock_db)

                # Verify graceful degradation
                assert result.answer == "Answer text"
                assert result.chart is None  # No chart due to error


def test_generate_chart_from_config_bar():
    """Test generating bar chart from config"""
    df = pd.DataFrame({"category": ["A", "B"], "value": [100, 200]})
    schema = Mock()
    config = {
        "chart_type": "bar",
        "category_column": "category",
        "value_column": "value",
        "title": "Test Bar",
    }

    with patch("app.api.routes.query.ChartGenerator") as mock_chart_gen_class:
        mock_chart_gen = Mock()
        mock_chart_config = Mock()
        mock_chart_config.to_dict.return_value = {
            "chart_type": "bar",
            "x_column": "category",
            "y_column": "value",
            "data": [{"category": "A", "value": 100}],
            "priority": 1,
        }
        mock_chart_gen._create_bar_chart.return_value = mock_chart_config
        mock_chart_gen_class.return_value = mock_chart_gen

        result = _generate_chart_from_config(df, schema, config)

        assert result.chart_type == "bar"
        assert result.title == "Test Bar"


def test_generate_chart_from_config_line():
    """Test generating line chart from config"""
    df = pd.DataFrame({"x": [1, 2, 3], "y": [10, 20, 30]})
    schema = Mock()
    config = {"chart_type": "line", "x_column": "x", "y_column": "y", "title": "Test Line"}

    with patch("app.api.routes.query.ChartGenerator") as mock_chart_gen_class:
        mock_chart_gen = Mock()
        mock_chart_config = Mock()
        mock_chart_config.to_dict.return_value = {
            "chart_type": "line",
            "x_column": "x",
            "y_column": "y",
            "data": [{"x": 1, "y": 10}],
            "priority": 1,
        }
        mock_chart_gen._create_line_chart.return_value = mock_chart_config
        mock_chart_gen_class.return_value = mock_chart_gen

        result = _generate_chart_from_config(df, schema, config)

        assert result.chart_type == "line"
        assert result.title == "Test Line"


def test_generate_chart_from_config_pie():
    """Test generating pie chart from config"""
    df = pd.DataFrame({"category": ["A", "B", "C"], "value": [10, 20, 30]})
    schema = Mock()
    config = {
        "chart_type": "pie",
        "category_column": "category",
        "value_column": "value",
        "title": "Test Pie",
    }

    with patch("app.api.routes.query.ChartGenerator") as mock_chart_gen_class:
        mock_chart_gen = Mock()
        mock_chart_config = Mock()
        mock_chart_config.to_dict.return_value = {
            "chart_type": "pie",
            "x_column": "category",
            "y_column": "value",
            "data": [{"category": "A", "value": 10}],
            "priority": 1,
        }
        mock_chart_gen._create_pie_chart.return_value = mock_chart_config
        mock_chart_gen_class.return_value = mock_chart_gen

        result = _generate_chart_from_config(df, schema, config)

        assert result.chart_type == "pie"
        assert result.title == "Test Pie"


def test_generate_chart_from_config_scatter():
    """Test generating scatter chart from config"""
    df = pd.DataFrame({"x": [1, 2, 3], "y": [10, 20, 30]})
    schema = Mock()
    config = {"chart_type": "scatter", "x_column": "x", "y_column": "y", "title": "Test Scatter"}

    with patch("app.api.routes.query.ChartGenerator") as mock_chart_gen_class:
        mock_chart_gen = Mock()
        mock_chart_config = Mock()
        mock_chart_config.to_dict.return_value = {
            "chart_type": "scatter",
            "x_column": "x",
            "y_column": "y",
            "data": [{"x": 1, "y": 10}],
            "priority": 1,
        }
        mock_chart_gen._create_scatter_chart.return_value = mock_chart_config
        mock_chart_gen_class.return_value = mock_chart_gen

        result = _generate_chart_from_config(df, schema, config)

        assert result.chart_type == "scatter"
        assert result.title == "Test Scatter"


def test_generate_chart_from_config_invalid():
    """Test that invalid config raises ValueError"""
    df = pd.DataFrame({"x": [1, 2]})
    schema = Mock()
    config = {"chart_type": "unknown"}

    with pytest.raises(ValueError, match="Invalid chart configuration"):
        _generate_chart_from_config(df, schema, config)
