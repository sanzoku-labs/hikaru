# Hikaru - AI Data Insight Board

**Type**: Application
**Status**: Active - Production Ready (v1.0.0)

## Overview

Hikaru is an AI-powered data analytics dashboard that transforms CSV/Excel files into interactive BI dashboards with AI-generated insights. It's a simplified, intelligent alternative to Power BI or Tableau, designed for non-technical users. Upload your data and instantly get automatic chart generation, AI-powered insights from Claude Sonnet 4, natural language Q&A, and professional PDF reports.

## Role in Sanzoku Labs

- **Category**: Application
- **Purpose**:
  - Democratize data analytics for non-technical users through AI-powered automation
  - Provide instant business insights from CSV/Excel data without manual configuration
  - Enable multi-file data analysis with comparison, merging, and conversational Q&A
- **Related projects**: None (standalone application)

## Current State

- **Implemented:**
  - Complete MVP (Phases 1-5): File upload, chart generation, AI insights, Q&A chat, PDF export
  - Phase 7: Multi-file projects with comparison and SQL-like merging
  - Phase 8: JWT authentication with user isolation
  - Phase 9: High-fidelity UI redesign with professional interface
  - Backend refactoring (Weeks 3-4): Service splitting, deprecation fixes, type safety
  - Phase 5: Comprehensive testing suite (253 tests, 55% coverage)

- **In Progress:**
  - None - all core features complete

- **Planned / Future:**
  - Phase 10: Enhanced testing & quality assurance (E2E tests, performance optimization)
  - Phase 11: Production deployment (CI/CD, PostgreSQL migration, monitoring)
  - Real-time collaboration (multi-user editing)
  - Custom chart builder (user-defined visualizations)
  - Scheduled reports (automated PDF exports)
  - Data source connectors (Google Sheets, databases)
  - Advanced AI features (trend forecasting, anomaly detection)

- **On Hold:**
  - None

## Tech Stack

- **Backend Language**: Python 3.11+
- **Backend Framework**: FastAPI with Poetry dependency management
- **Frontend Language**: TypeScript
- **Frontend Framework**: React 18 + Vite
- **Database**: SQLite (PostgreSQL-ready for production)
- **Data Processing**: Pandas, DuckDB
- **AI/ML**: Anthropic Claude Sonnet 4
- **Authentication**: JWT + bcrypt
- **UI Library**: shadcn/ui (35 components) + Tailwind CSS
- **Charts**: ECharts v5
- **PDF Generation**: ReportLab
- **Routing**: React Router v6
- **Tooling:**
  - Backend: Pytest (testing), Black (formatting), Ruff (linting), Mypy (type checking)
  - Frontend: Vitest (testing - planned), Prettier (formatting), ESLint (linting)
  - DevOps: Alembic (migrations), GitHub Actions (CI/CD - planned)

## Folder Structure

```
hikaru/
├── backend/                    # FastAPI application
│   ├── app/
│   │   ├── main.py            # Entry point
│   │   ├── api/routes/        # 25+ API endpoints
│   │   ├── services/          # Business logic (12+ services)
│   │   ├── models/            # SQLAlchemy models + Pydantic schemas
│   │   └── middleware/        # Auth middleware
│   ├── alembic/               # Database migrations
│   ├── tests/                 # 253 tests (55% coverage)
│   └── pyproject.toml         # Poetry dependencies
│
├── frontend/                   # React application
│   ├── src/
│   │   ├── main.tsx           # Entry point
│   │   ├── pages/             # 10 page components
│   │   ├── components/        # 45+ reusable components
│   │   ├── services/          # API client
│   │   └── types/             # TypeScript types
│   ├── dist/                  # Production build (1.66 MB, 521 KB gzipped)
│   └── package.json           # npm dependencies
│
├── docs/                       # Comprehensive documentation
│   ├── completed/             # Phase completion reports
│   ├── features/              # Feature usage guides
│   ├── reference/             # Technical references
│   └── archive/               # Historical docs
│
├── PROGRESS.md                 # Current project status
├── CLAUDE.md                   # Development guidelines for AI assistants
└── README.md                   # User-facing documentation
```

## Key Features

- **File Upload**: Drag-and-drop CSV/Excel with automatic schema detection (US & European formats)
- **Chart Generation**: Priority-based automatic chart selection (line, bar, pie, scatter) + AI suggestions
- **AI Insights**: Per-chart insights + global summary using Claude Sonnet 4
- **Q&A Chat**: Natural language queries with conversation context
- **PDF Export**: Professional report generation with charts and insights
- **Multi-File Projects**: Organize and analyze multiple datasets in workspaces
- **File Comparison**: Side-by-side diff with 3 comparison types (side-by-side, trend, year-over-year)
- **File Merging**: SQL-like joins (inner, left, right, outer) with preview
- **User Authentication**: JWT-based secure authentication with user data isolation

## Performance Metrics

- File upload: < 2s ✅
- Chart generation: < 3s per chart ✅
- AI insights: < 8s total ✅
- PDF export: < 5s ✅
- Production build: 3.17s ✅
- Bundle size: 1.66 MB (521 KB gzipped) ✅
