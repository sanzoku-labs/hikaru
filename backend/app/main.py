import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy.exc import SQLAlchemyError

from app.api.routes import (
    analytics,
    analyze,
    assistant,
    auth,
    compare,
    dashboards,
    export,
    history,
    insights,
    merge,
    projects,
    query,
    reports,
    upload,
)
from app.config import settings
from app.core.exception_handlers import (
    app_exception_handler,
    generic_exception_handler,
    sqlalchemy_exception_handler,
    validation_exception_handler,
)
from app.core.exceptions import AppException
from app.core.rate_limit import limiter
from app.middleware.security_headers import SecurityHeadersMiddleware

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Validate critical settings on startup."""
    if not os.environ.get("TESTING"):
        placeholder = "your-secret-key-change-in-production"
        if not settings.secret_key or settings.secret_key == placeholder:
            raise RuntimeError(
                "SECRET_KEY is not configured. "
                "Set the SECRET_KEY environment variable before starting the server."
            )
        if not settings.encryption_key:
            logger.warning("ENCRYPTION_KEY not set. OAuth tokens will be stored in plaintext.")
    yield


app = FastAPI(
    title="Hikaru API",
    description="AI Data Insight Board API - Phase 7 (Projects & Multi-File Workspaces)",
    version="3.0.0",
    lifespan=lifespan,
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Security headers (added before CORS so it runs after CORS in middleware stack)
app.add_middleware(SecurityHeadersMiddleware)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# Exception handlers
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Include routers
app.include_router(auth.router)  # Phase 8: Authentication endpoints
app.include_router(upload.router)
app.include_router(analyze.router)
app.include_router(query.router)
app.include_router(export.router)
app.include_router(projects.router)  # Phase 7A: Project management
app.include_router(compare.router)  # Phase 7B: File comparison
app.include_router(merge.router)  # Phase 7C: File merging
app.include_router(dashboards.router)  # Phase 7E: Dashboard management
app.include_router(analytics.router)  # Analytics dashboard
app.include_router(insights.router)  # Phase 10: Advanced chart insights
app.include_router(history.router)  # History: Browse all analyses
app.include_router(assistant.router)  # AI Assistant: Cross-file queries
app.include_router(reports.router)  # Reports: Template gallery and generation

if settings.feature_integrations_enabled:
    from app.api.routes import integrations

    app.include_router(integrations.router)  # Integrations: Third-party data sources


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=settings.reload)
