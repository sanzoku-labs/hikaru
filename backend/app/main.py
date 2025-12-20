from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError

from app.api.routes import (
    analyze,
    analytics,
    assistant,
    auth,
    compare,
    dashboards,
    export,
    history,
    insights,
    integrations,
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

app = FastAPI(
    title="Hikaru API",
    description="AI Data Insight Board API - Phase 7 (Projects & Multi-File Workspaces)",
    version="3.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
app.include_router(integrations.router)  # Integrations: Third-party data sources


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=settings.reload)
