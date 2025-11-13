from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.routes import upload, analyze, query, export, auth, projects, compare, merge, dashboards

app = FastAPI(
    title="Hikaru API",
    description="AI Data Insight Board API - Phase 7 (Projects & Multi-File Workspaces)",
    version="3.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)  # Phase 8: Authentication endpoints
app.include_router(upload.router)
app.include_router(analyze.router)
app.include_router(query.router)
app.include_router(export.router)
app.include_router(projects.router)  # Phase 7A: Project management
app.include_router(compare.router)   # Phase 7B: File comparison
app.include_router(merge.router)     # Phase 7C: File merging
app.include_router(dashboards.router)  # Phase 7E: Dashboard management

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload
    )
