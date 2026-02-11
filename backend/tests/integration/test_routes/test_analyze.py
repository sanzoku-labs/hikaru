"""
Integration tests for /api/analyze endpoint.

Tests the complete flow of analyzing uploaded data:
- Chart generation (AI-powered and heuristic fallback)
- AI insights generation
- Global summary generation
- Error handling
"""
import io
import uuid

import pandas as pd
import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.database import User
from app.services.upload_service import UploadService


class TestAnalyzeEndpoint:
    """Test suite for /api/analyze/{upload_id} endpoint"""

    @pytest.fixture
    def sample_csv_file(self):
        """Create a sample CSV file for testing"""
        csv_content = """id,name,category,value,date,quantity
1,Product A,Electronics,299.99,2024-01-15,10
2,Product B,Clothing,49.99,2024-01-16,25
3,Product C,Electronics,599.99,2024-01-17,5
4,Product D,Food,12.99,2024-01-18,50
5,Product E,Books,24.99,2024-01-19,15
6,Product F,Electronics,199.99,2024-01-20,8
7,Product G,Clothing,79.99,2024-01-21,20
8,Product H,Food,8.99,2024-01-22,100
9,Product I,Books,34.99,2024-01-23,12
10,Product J,Electronics,449.99,2024-01-24,6"""
        return io.BytesIO(csv_content.encode())

    @pytest.fixture
    def uploaded_file(self, db_session: Session, test_user: User, sample_csv_file):
        """Upload a sample file and return upload_id"""
        # Read CSV into DataFrame
        sample_csv_file.seek(0)
        df = pd.read_csv(sample_csv_file)

        # Parse datetime
        df["date"] = pd.to_datetime(df["date"])

        # Create schema
        from app.services.data_processor import DataProcessor

        schema = DataProcessor.analyze_schema(df)

        # Store upload
        upload_service = UploadService(db_session)
        upload_id = str(uuid.uuid4())

        upload_service.store_upload(
            upload_id=upload_id,
            filename="test_data.csv",
            schema=schema,
            df=df,
            user_id=test_user.id,  # Associate upload with test_user
        )

        return upload_id

    def test_analyze_success_without_user_intent(
        self, client: TestClient, uploaded_file: str, auth_headers: dict
    ):
        """Test successful analysis without user intent"""
        response = client.post(
            f"/api/analyze/{uploaded_file}", json={}, headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Verify response structure
        assert "upload_id" in data
        assert data["upload_id"] == uploaded_file
        assert "filename" in data
        assert data["filename"] == "test_data.csv"
        assert "data_schema" in data
        assert "charts" in data
        assert "upload_timestamp" in data

        # Verify data schema
        schema = data["data_schema"]
        assert schema["row_count"] == 10
        assert len(schema["columns"]) == 6

        # Verify charts were generated
        charts = data["charts"]
        assert len(charts) > 0
        assert len(charts) <= 4  # Max charts limit

        # Verify chart structure
        for chart in charts:
            assert "chart_type" in chart
            assert chart["chart_type"] in ["line", "bar", "pie", "scatter"]
            assert "title" in chart
            assert "data" in chart
            assert isinstance(chart["data"], list)

    def test_analyze_success_with_user_intent(
        self, client: TestClient, uploaded_file: str, auth_headers: dict
    ):
        """Test successful analysis with user intent"""
        user_intent = "Show me sales by category"

        response = client.post(
            f"/api/analyze/{uploaded_file}",
            json={"user_intent": user_intent},
            headers=auth_headers,
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Verify charts were generated
        assert len(data["charts"]) > 0

        # When user intent is provided, AI should attempt to generate relevant charts
        # (Will fall back to heuristics if AI is disabled)
        charts = data["charts"]
        assert all(isinstance(chart["data"], list) for chart in charts)

    def test_analyze_with_ai_insights(
        self, client: TestClient, uploaded_file: str, auth_headers: dict
    ):
        """Test analysis response structure supports AI insights"""
        # Note: AI is disabled in test environment (no valid API key)
        # This test verifies the endpoint structure supports insights fields
        response = client.post(
            f"/api/analyze/{uploaded_file}", json={}, headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Verify response structure includes insight-related fields
        assert "global_summary" in data
        # In test environment without API key, global_summary will be None
        assert data["global_summary"] is None or isinstance(data["global_summary"], str)

    def test_analyze_nonexistent_upload_id(self, client: TestClient, auth_headers: dict):
        """Test analysis with non-existent upload_id returns 404"""
        fake_upload_id = str(uuid.uuid4())

        response = client.post(
            f"/api/analyze/{fake_upload_id}", json={}, headers=auth_headers
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "not found" in response.json()["detail"].lower()

    def test_analyze_without_authentication(self, client: TestClient, uploaded_file: str):
        """Test analysis without authentication returns 403"""
        response = client.post(f"/api/analyze/{uploaded_file}", json={})

        # FastAPI returns 403 when no credentials provided
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_analyze_with_invalid_token(self, client: TestClient, uploaded_file: str):
        """Test analysis with invalid token returns 401"""
        headers = {"Authorization": "Bearer invalid_token"}

        response = client.post(
            f"/api/analyze/{uploaded_file}", json={}, headers=headers
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_analyze_other_users_upload(
        self,
        client: TestClient,
        db_session: Session,
        uploaded_file: str,
        superuser: User,
        superuser_headers: dict,
    ):
        """Test that users cannot analyze other users' uploads"""
        # uploaded_file belongs to test_user, trying to access with superuser
        response = client.post(
            f"/api/analyze/{uploaded_file}", json={}, headers=superuser_headers
        )

        # Should return 404 (file not found for this user)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_analyze_generates_multiple_chart_types(
        self, client: TestClient, uploaded_file: str, auth_headers: dict
    ):
        """Test that analysis generates diverse chart types"""
        response = client.post(
            f"/api/analyze/{uploaded_file}", json={}, headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        charts = data["charts"]
        chart_types = {chart["chart_type"] for chart in charts}

        # With the sample data (datetime, categorical, numeric),
        # we should get at least 2 different chart types
        assert len(chart_types) >= 2

    def test_analyze_response_includes_all_required_fields(
        self, client: TestClient, uploaded_file: str, auth_headers: dict
    ):
        """Test that response includes all required fields per schema"""
        response = client.post(
            f"/api/analyze/{uploaded_file}", json={}, headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Required fields from AnalyzeResponse schema
        required_fields = ["upload_id", "filename", "data_schema", "charts", "upload_timestamp"]

        for field in required_fields:
            assert field in data, f"Missing required field: {field}"

        # Data schema should have required fields
        schema = data["data_schema"]
        assert "row_count" in schema
        assert "columns" in schema
        assert "preview" in schema

        # Each column should have required fields
        for col in schema["columns"]:
            assert "name" in col
            assert "type" in col

    def test_analyze_charts_have_valid_data(
        self, client: TestClient, uploaded_file: str, auth_headers: dict
    ):
        """Test that generated charts contain valid data points"""
        response = client.post(
            f"/api/analyze/{uploaded_file}", json={}, headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        for chart in data["charts"]:
            # Every chart should have data
            assert len(chart["data"]) > 0

            # Verify data structure based on chart type
            if chart["chart_type"] == "pie":
                for point in chart["data"]:
                    assert "name" in point
                    assert "value" in point
            elif chart["chart_type"] == "bar":
                for point in chart["data"]:
                    assert "category" in point
                    assert "value" in point
            elif chart["chart_type"] == "line":
                for point in chart["data"]:
                    assert "x" in point
                    assert "y" in point
            elif chart["chart_type"] == "scatter":
                for point in chart["data"]:
                    assert "x" in point
                    assert "y" in point
