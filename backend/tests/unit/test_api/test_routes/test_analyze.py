"""
Unit tests for analyze API route.
"""
from datetime import datetime
from unittest.mock import Mock, patch

import pandas as pd
import pytest
from fastapi import HTTPException

from app.api.routes.analyze import analyze_data
from app.models.schemas import ChartData, ColumnInfo, DataSchema


@pytest.fixture
def mock_db():
    """Mock database session"""
    return Mock()


@pytest.fixture
def mock_user():
    """Mock authenticated user"""
    user = Mock()
    user.id = 1
    user.email = "test@example.com"
    user.is_active = True
    return user


@pytest.fixture
def sample_upload_data():
    """Sample upload data"""
    df = pd.DataFrame({
        "date": pd.date_range("2024-01-01", periods=10, freq="D"),
        "revenue": [100, 150, 200, 250, 300, 350, 400, 450, 500, 550],
    })

    schema = DataSchema(
        columns=[
            ColumnInfo(
                name="date",
                type="datetime",
                unique_values=10,
                null_count=0,
                sample_values=["2024-01-01", "2024-01-02"],
            ),
            ColumnInfo(
                name="revenue",
                type="numeric",
                unique_values=10,
                null_count=0,
                sample_values=[100, 150],
                min=100,
                max=550,
                mean=325,
                median=325,
            ),
        ],
        row_count=10,
        preview=[],
    )

    return {
        "dataframe": df,
        "schema": schema,
        "filename": "test_data.csv",
        "timestamp": datetime.now().isoformat(),
    }


@pytest.mark.asyncio
async def test_analyze_data_success(mock_db, mock_user, sample_upload_data):
    """Test successful data analysis"""
    with patch("app.api.routes.analyze.UploadService") as mock_upload_service_class:
        with patch("app.api.routes.analyze.AnalysisService") as mock_analysis_service_class:
            # Setup mocks
            mock_upload_service = Mock()
            mock_upload_service.get_upload.return_value = sample_upload_data
            mock_upload_service_class.return_value = mock_upload_service

            mock_analysis_service = Mock()
            mock_analysis_service.perform_full_analysis.return_value = {
                "charts": [
                    ChartData(
                        chart_type="line",
                        title="Revenue Over Time",
                        x_column="date",
                        y_column="revenue",
                        data=[{"x": "2024-01-01", "y": 100}],
                        priority=1,
                    )
                ],
                "global_summary": "Revenue shows steady growth.",
            }
            mock_analysis_service_class.return_value = mock_analysis_service

            # Call endpoint
            result = await analyze_data(
                upload_id="test-123",
                user_intent=None,
                current_user=mock_user,
                db=mock_db,
            )

            # Verify
            assert result.upload_id == "test-123"
            assert result.filename == "test_data.csv"
            assert len(result.charts) == 1
            assert result.charts[0].title == "Revenue Over Time"
            assert result.global_summary == "Revenue shows steady growth."


@pytest.mark.asyncio
async def test_analyze_data_with_user_intent(mock_db, mock_user, sample_upload_data):
    """Test analysis with user intent"""
    with patch("app.api.routes.analyze.UploadService") as mock_upload_service_class:
        with patch("app.api.routes.analyze.AnalysisService") as mock_analysis_service_class:
            # Setup mocks
            mock_upload_service = Mock()
            mock_upload_service.get_upload.return_value = sample_upload_data
            mock_upload_service_class.return_value = mock_upload_service

            mock_analysis_service = Mock()
            mock_analysis_service.perform_full_analysis.return_value = {
                "charts": [],
                "global_summary": None,
            }
            mock_analysis_service_class.return_value = mock_analysis_service

            # Call endpoint
            await analyze_data(
                upload_id="test-123",
                user_intent="Show me revenue trends",
                current_user=mock_user,
                db=mock_db,
            )

            # Verify user intent was passed
            mock_analysis_service.perform_full_analysis.assert_called_once()
            call_args = mock_analysis_service.perform_full_analysis.call_args
            assert call_args[1]["user_intent"] == "Show me revenue trends"


@pytest.mark.asyncio
async def test_analyze_data_error_handling(mock_db, mock_user, sample_upload_data):
    """Test error handling when analysis fails"""
    with patch("app.api.routes.analyze.UploadService") as mock_upload_service_class:
        with patch("app.api.routes.analyze.AnalysisService") as mock_analysis_service_class:
            # Setup mocks - upload succeeds but analysis fails
            mock_upload_service = Mock()
            mock_upload_service.get_upload.return_value = sample_upload_data
            mock_upload_service_class.return_value = mock_upload_service

            mock_analysis_service = Mock()
            mock_analysis_service.perform_full_analysis.side_effect = Exception("Analysis failed")
            mock_analysis_service_class.return_value = mock_analysis_service

            # Should raise HTTPException
            with pytest.raises(HTTPException) as exc_info:
                await analyze_data(
                    upload_id="test-123",
                    user_intent=None,
                    current_user=mock_user,
                    db=mock_db,
                )

            assert exc_info.value.status_code == 500
            assert "Error analyzing file" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_analyze_data_calls_services_correctly(mock_db, mock_user, sample_upload_data):
    """Test that services are called with correct parameters"""
    with patch("app.api.routes.analyze.UploadService") as mock_upload_service_class:
        with patch("app.api.routes.analyze.AnalysisService") as mock_analysis_service_class:
            # Setup mocks
            mock_upload_service = Mock()
            mock_upload_service.get_upload.return_value = sample_upload_data
            mock_upload_service_class.return_value = mock_upload_service

            mock_analysis_service = Mock()
            mock_analysis_service.perform_full_analysis.return_value = {
                "charts": [],
                "global_summary": None,
            }
            mock_analysis_service_class.return_value = mock_analysis_service

            # Call endpoint
            await analyze_data(
                upload_id="test-123",
                user_intent=None,
                current_user=mock_user,
                db=mock_db,
            )

            # Verify UploadService was instantiated with db
            mock_upload_service_class.assert_called_once_with(mock_db)

            # Verify get_upload was called with upload_id
            mock_upload_service.get_upload.assert_called_once_with("test-123")

            # Verify AnalysisService was called
            mock_analysis_service.perform_full_analysis.assert_called_once()
            call_kwargs = mock_analysis_service.perform_full_analysis.call_args[1]
            assert "df" in call_kwargs
            assert "schema" in call_kwargs
            assert call_kwargs["max_charts"] == 4
