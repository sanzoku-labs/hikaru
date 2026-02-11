"""Tests for global exception handlers."""
from unittest.mock import Mock

import pytest
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError

from app.core.exception_handlers import (
    app_exception_handler,
    generic_exception_handler,
    sqlalchemy_exception_handler,
    validation_exception_handler,
)
from app.core.exceptions import AppException


@pytest.fixture
def mock_request():
    """Mock FastAPI request."""
    request = Mock()
    request.url = "http://test/api/test"
    request.method = "GET"
    return request


@pytest.mark.asyncio
async def test_app_exception_handler(mock_request):
    """Test custom AppException is converted to JSON response."""
    exc = AppException(status_code=400, error_code="test_error", detail="Test error")
    response = await app_exception_handler(mock_request, exc)
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_validation_exception_handler(mock_request):
    """Test Pydantic validation errors are handled."""
    exc = RequestValidationError(errors=[{"loc": ["body", "name"], "msg": "required"}])
    response = await validation_exception_handler(mock_request, exc)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_sqlalchemy_exception_handler(mock_request):
    """Test SQLAlchemy errors return 500."""
    exc = SQLAlchemyError("connection failed")
    response = await sqlalchemy_exception_handler(mock_request, exc)
    assert response.status_code == 500


@pytest.mark.asyncio
async def test_generic_exception_handler(mock_request):
    """Test unexpected exceptions return 500."""
    exc = RuntimeError("unexpected")
    response = await generic_exception_handler(mock_request, exc)
    assert response.status_code == 500
