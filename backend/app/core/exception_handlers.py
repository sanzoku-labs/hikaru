"""
Global exception handlers for the FastAPI application.

These handlers convert custom exceptions into proper HTTP responses
with consistent error formatting.
"""
import logging

from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.core.exceptions import AppException

logger = logging.getLogger(__name__)


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """
    Handle custom application exceptions.

    Converts AppException instances into JSON responses with proper status codes.
    """
    logger.error(
        f"Application error: {exc.error_code} - {exc.detail}",
        extra={
            "error_code": exc.error_code,
            "status_code": exc.status_code,
            "path": str(request.url),
            "method": request.method,
        },
    )

    return JSONResponse(status_code=exc.status_code, content=exc.to_dict())


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """
    Handle Pydantic validation errors.

    Converts validation errors into user-friendly error messages.
    """
    errors = exc.errors()

    logger.warning(f"Validation error on {request.url}", extra={"errors": errors})

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error_code": "validation_error",
            "detail": "Input validation failed",
            "errors": errors,
        },
    )


async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    """
    Handle SQLAlchemy database errors.

    Logs the error and returns a generic message to avoid leaking
    database information to clients.
    """
    logger.error(
        f"Database error: {str(exc)}",
        extra={
            "path": str(request.url),
            "method": request.method,
        },
        exc_info=True,
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error_code": "database_error",
            "detail": "A database error occurred. Please try again later.",
        },
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Handle unexpected exceptions.

    Catches any unhandled exceptions and returns a generic 500 error
    without exposing internal details.
    """
    logger.error(
        f"Unexpected error: {type(exc).__name__} - {str(exc)}",
        extra={
            "path": str(request.url),
            "method": request.method,
        },
        exc_info=True,
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error_code": "internal_server_error",
            "detail": "An unexpected error occurred. Please try again later.",
        },
    )
