"""
Tests for custom exception classes.
"""

from app.core.exceptions import (
    AIServiceError,
    AnalysisNotFoundError,
    AppException,
    ExportNotFoundError,
    FileNotFoundError,
    FileTooLargeError,
    InsufficientPermissionsError,
    InvalidFileTypeError,
    ProjectNotFoundError,
    ResourceConflictError,
    UnauthorizedError,
    ValidationError,
)


class TestAppException:
    """Tests for base AppException class."""

    def test_app_exception_has_status_code(self):
        error = AppException(status_code=400, error_code="test_error", detail="Test error message")
        assert error.status_code == 400
        assert error.error_code == "test_error"
        assert error.detail == "Test error message"

    def test_app_exception_str_representation(self):
        error = AppException(status_code=400, error_code="test_error", detail="Test message")
        assert "Test message" in str(error)


class TestProjectNotFoundError:
    """Tests for ProjectNotFoundError."""

    def test_has_correct_status_code(self):
        error = ProjectNotFoundError("Project 123")
        assert error.status_code == 404

    def test_has_correct_error_code(self):
        error = ProjectNotFoundError("Project 123")
        assert error.error_code == "project_not_found"

    def test_includes_project_id_in_message(self):
        error = ProjectNotFoundError("Project 123")
        assert "123" in error.detail


class TestFileNotFoundError:
    """Tests for FileNotFoundError."""

    def test_has_correct_status_code(self):
        error = FileNotFoundError("file.csv")
        assert error.status_code == 404

    def test_has_correct_error_code(self):
        error = FileNotFoundError("file.csv")
        assert error.error_code == "file_not_found"


class TestUnauthorizedError:
    """Tests for UnauthorizedError."""

    def test_has_correct_status_code(self):
        error = UnauthorizedError("Invalid token")
        assert error.status_code == 401

    def test_has_correct_error_code(self):
        error = UnauthorizedError("Invalid token")
        assert error.error_code == "unauthorized"

    def test_includes_message(self):
        error = UnauthorizedError("Invalid token")
        assert "Invalid token" in str(error)


class TestValidationError:
    """Tests for ValidationError."""

    def test_has_correct_status_code(self):
        error = ValidationError("Invalid input")
        assert error.status_code == 400

    def test_has_correct_error_code(self):
        error = ValidationError("Invalid input")
        assert error.error_code == "validation_error"


class TestInsufficientPermissionsError:
    """Tests for InsufficientPermissionsError."""

    def test_has_correct_status_code(self):
        error = InsufficientPermissionsError("Access denied")
        assert error.status_code == 403

    def test_has_correct_error_code(self):
        error = InsufficientPermissionsError("Access denied")
        assert error.error_code == "insufficient_permissions"


class TestResourceConflictError:
    """Tests for ResourceConflictError."""

    def test_has_correct_status_code(self):
        error = ResourceConflictError("Resource already exists")
        assert error.status_code == 409

    def test_has_correct_error_code(self):
        error = ResourceConflictError("Resource already exists")
        assert error.error_code == "resource_conflict"


class TestFileTooLargeError:
    """Tests for FileTooLargeError."""

    def test_has_correct_status_code(self):
        error = FileTooLargeError("File exceeds 30MB")
        assert error.status_code == 413

    def test_has_correct_error_code(self):
        error = FileTooLargeError("File exceeds 30MB")
        assert error.error_code == "file_too_large"


class TestInvalidFileTypeError:
    """Tests for InvalidFileTypeError."""

    def test_has_correct_status_code(self):
        error = InvalidFileTypeError(".exe not allowed")
        assert error.status_code == 400

    def test_has_correct_error_code(self):
        error = InvalidFileTypeError(".exe not allowed")
        assert error.error_code == "invalid_file_type"


class TestAIServiceError:
    """Tests for AIServiceError."""

    def test_has_correct_status_code(self):
        error = AIServiceError("API request failed")
        assert error.status_code == 503

    def test_has_correct_error_code(self):
        error = AIServiceError("API request failed")
        assert error.error_code == "ai_service_error"


class TestAnalysisNotFoundError:
    """Tests for AnalysisNotFoundError."""

    def test_has_correct_status_code(self):
        error = AnalysisNotFoundError("Analysis not found")
        assert error.status_code == 404

    def test_has_correct_error_code(self):
        error = AnalysisNotFoundError("Analysis not found")
        assert error.error_code == "analysis_not_found"


class TestExportNotFoundError:
    """Tests for ExportNotFoundError."""

    def test_has_correct_status_code(self):
        error = ExportNotFoundError("Export not found")
        assert error.status_code == 404

    def test_has_correct_error_code(self):
        error = ExportNotFoundError("Export not found")
        assert error.error_code == "export_not_found"


class TestAppExceptionMethods:
    """Tests for AppException utility methods."""

    def test_to_dict_without_extra(self):
        error = AppException(status_code=400, error_code="test", detail="msg")
        result = error.to_dict()
        assert result == {"error_code": "test", "detail": "msg"}
        assert "extra" not in result

    def test_to_dict_with_extra(self):
        error = AppException(
            status_code=400, error_code="test", detail="msg", extra={"field": "name"}
        )
        result = error.to_dict()
        assert result["extra"] == {"field": "name"}

    def test_str_format(self):
        error = AppException(status_code=400, error_code="test_error", detail="test msg")
        assert str(error) == "test_error: test msg"
