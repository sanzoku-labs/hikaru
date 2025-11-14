"""
Custom exception classes for the application.

These exceptions provide structured error handling with consistent
error codes and HTTP status codes.
"""
from typing import Any, Dict, Optional


class AppException(Exception):
    """Base exception class for all application exceptions."""

    def __init__(
        self, status_code: int, error_code: str, detail: str, extra: Optional[Dict[str, Any]] = None
    ):
        self.status_code = status_code
        self.error_code = error_code
        self.detail = detail
        self.extra = extra or {}
        super().__init__(self.detail)

    def __str__(self) -> str:
        return f"{self.error_code}: {self.detail}"

    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to dictionary for API response."""
        result = {
            "error_code": self.error_code,
            "detail": self.detail,
        }
        if self.extra:
            result["extra"] = self.extra
        return result


class ProjectNotFoundError(AppException):
    """Raised when a project is not found or user doesn't have access."""

    def __init__(self, detail: str):
        super().__init__(status_code=404, error_code="project_not_found", detail=detail)


class FileNotFoundError(AppException):
    """Raised when a file is not found."""

    def __init__(self, detail: str):
        super().__init__(status_code=404, error_code="file_not_found", detail=detail)


class UnauthorizedError(AppException):
    """Raised when authentication fails."""

    def __init__(self, detail: str):
        super().__init__(status_code=401, error_code="unauthorized", detail=detail)


class ValidationError(AppException):
    """Raised when input validation fails."""

    def __init__(self, detail: str, extra: Optional[Dict[str, Any]] = None):
        super().__init__(status_code=400, error_code="validation_error", detail=detail, extra=extra)


class InsufficientPermissionsError(AppException):
    """Raised when user doesn't have permission for an action."""

    def __init__(self, detail: str):
        super().__init__(status_code=403, error_code="insufficient_permissions", detail=detail)


class ResourceConflictError(AppException):
    """Raised when a resource conflict occurs (e.g., duplicate)."""

    def __init__(self, detail: str):
        super().__init__(status_code=409, error_code="resource_conflict", detail=detail)


class FileTooLargeError(AppException):
    """Raised when uploaded file exceeds size limit."""

    def __init__(self, detail: str):
        super().__init__(status_code=413, error_code="file_too_large", detail=detail)


class InvalidFileTypeError(AppException):
    """Raised when file type is not allowed."""

    def __init__(self, detail: str):
        super().__init__(status_code=400, error_code="invalid_file_type", detail=detail)


class AIServiceError(AppException):
    """Raised when AI service encounters an error."""

    def __init__(self, detail: str):
        super().__init__(status_code=503, error_code="ai_service_error", detail=detail)


class AnalysisNotFoundError(AppException):
    """Raised when analysis results are not found."""

    def __init__(self, detail: str):
        super().__init__(status_code=404, error_code="analysis_not_found", detail=detail)


class ExportNotFoundError(AppException):
    """Raised when export task is not found."""

    def __init__(self, detail: str):
        super().__init__(status_code=404, error_code="export_not_found", detail=detail)
