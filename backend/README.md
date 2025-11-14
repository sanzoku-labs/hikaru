# Hikaru Backend

**Status**: ✅ Production Ready  
**Framework**: FastAPI (Python 3.13)  
**Test Coverage**: 41% (92 tests passing)  
**Last Updated**: November 14, 2025

AI-powered data insight dashboard backend with authentication, projects, and multi-file analysis.

---

## 📚 Documentation

**Looking for documentation?**  
→ See main project: [`../DOCUMENTATION_INDEX.md`](../DOCUMENTATION_INDEX.md)

**Quick Links:**
- **Refactoring Plan**: [`REFACTORING_ROADMAP.md`](REFACTORING_ROADMAP.md) - 5-week structured refactoring
- **Project Status**: [`../PROGRESS.md`](../PROGRESS.md) - Overall project status
- **Old Docs**: [`docs/archive/`](docs/archive/) - Historical phase documents

---

## Prerequisites

- Python 3.11+ (developed on 3.13)
- Poetry (install with: `curl -sSL https://install.python-poetry.org | python3 -`)
- Anthropic API key for AI features

## Setup with Poetry (Recommended)

```bash
# Install dependencies
poetry install

# Create .env file
cp .env.example .env

# Activate virtual environment
poetry shell

# Run development server
poetry run uvicorn app.main:app --reload --port 8000
```

## Alternative Setup with pip

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Run development server
uvicorn app.main:app --reload --port 8000
```

## API Documentation

**Interactive API Docs**: http://localhost:8000/docs (when server is running)

**Key Features:**
- 25+ REST API endpoints
- JWT authentication
- File upload and analysis
- Multi-file projects
- File comparison and merging
- AI-powered insights and Q&A
- PDF export generation

**Main Endpoints:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/upload` - Upload CSV/Excel file
- `POST /api/analyze/{upload_id}` - Generate charts
- `POST /api/query` - Q&A chat
- `POST /api/projects` - Create project
- `POST /api/projects/{id}/files` - Upload to project
- `POST /api/projects/{id}/compare` - Compare files
- `POST /api/projects/{id}/merge-analyze` - Merge files
- `POST /api/export` - Generate PDF

## Development

```bash
# Run tests (Poetry)
poetry run pytest

# Run tests with coverage (Poetry)
poetry run pytest --cov=app --cov-report=html

# Format code (Poetry)
poetry run black app/

# Lint code (Poetry)
poetry run ruff check app/

# Type checking (Poetry)
poetry run mypy app/

# Run with auto-reload (Poetry)
poetry run uvicorn app.main:app --reload
```

## Poetry Commands

```bash
# Add a new dependency
poetry add package-name

# Add a dev dependency
poetry add --group dev package-name

# Update dependencies
poetry update

# Show installed packages
poetry show

# Export requirements.txt (for compatibility)
poetry export -f requirements.txt --output requirements.txt --without-hashes
```

---

## 🔄 Refactoring Status

**Current Phase**: Week 4 - Architecture Patterns (See [`REFACTORING_ROADMAP.md`](REFACTORING_ROADMAP.md))

**Completed:**
- ✅ **Week 2**: Service Layer Pattern (ProjectService, AnalysisService)
- ✅ **Week 3**: Code Quality Improvements
  - Eliminated 20 deprecation warnings (Pydantic v2, SQLAlchemy 2.0, datetime)
  - Added comprehensive type hints to service layer
  - All 92 tests passing, 41% coverage maintained

**Next:**
- **Week 4**: Split large services (AIService → 3 focused services)
- **Week 5**: Testing & QA (target 85% coverage)

**Technical Debt Addressed:**
- Pydantic v2 migration complete
- SQLAlchemy 2.0 compatible
- Python 3.12+ timezone-aware datetime
- Comprehensive type hints in services

See [`../docs/completed/WEEK_3_REFACTORING.md`](../docs/completed/WEEK_3_REFACTORING.md) for details.

---

## 📁 Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Configuration (Pydantic Settings)
│   │
│   ├── api/                 # API layer
│   │   ├── dependencies.py  # Dependency injection
│   │   └── routes/          # 8 route modules (25+ endpoints)
│   │       ├── upload.py
│   │       ├── analyze.py
│   │       ├── export.py
│   │       ├── query.py
│   │       ├── auth.py
│   │       ├── projects.py
│   │       ├── dashboards.py
│   │       └── merge.py
│   │
│   ├── services/            # Business logic (Service Layer Pattern)
│   │   ├── ai_service.py          # AI insights (287 lines - to be split)
│   │   ├── analysis_service.py    # Chart generation orchestration
│   │   ├── auth_service.py        # Authentication
│   │   ├── cache_service.py       # In-memory caching
│   │   ├── chart_generator.py     # Chart heuristics
│   │   ├── data_processor.py      # Pandas/schema detection
│   │   ├── project_service.py     # Project CRUD
│   │   └── upload_service.py      # File upload handling
│   │
│   ├── models/              # Data models
│   │   ├── database.py      # SQLAlchemy models (8 tables)
│   │   └── schemas.py       # Pydantic models (30+ schemas)
│   │
│   ├── core/                # Core functionality
│   │   ├── exceptions.py         # Custom exceptions
│   │   └── exception_handlers.py # Global error handlers
│   │
│   └── storage.py           # File storage utilities
│
├── tests/                   # Test suite (92 tests)
│   └── unit/
│       ├── test_api/
│       ├── test_core/
│       └── test_services/
│
├── alembic/                 # Database migrations
├── storage/                 # Uploaded files (gitignored)
├── pyproject.toml           # Poetry dependencies
├── README.md                # This file
└── REFACTORING_ROADMAP.md   # 5-week refactoring plan
```

---

## 🧪 Testing

**Current Status:**
- Total Tests: 92
- Pass Rate: 100%
- Coverage: 41%

**Coverage by Module:**
| Module | Coverage | Tests |
|--------|----------|-------|
| `services/` | 13-100% | 46 tests |
| `core/` | 57-100% | 26 tests |
| `models/` | 94-100% | 8 tests |
| `api/routes/` | 15-38% | 12 tests |

**Target (Week 5):** 85% overall coverage

---

## 🛠️ Tech Stack

- **Framework**: FastAPI 0.100+
- **Python**: 3.11+ (developed on 3.13)
- **Package Manager**: Poetry
- **Database**: SQLite (PostgreSQL-ready with SQLAlchemy)
- **ORM**: SQLAlchemy 2.0
- **Validation**: Pydantic v2
- **Data Processing**: Pandas, DuckDB
- **AI**: Anthropic Claude Sonnet 4
- **Authentication**: JWT (PyJWT) + bcrypt
- **PDF Generation**: ReportLab
- **Testing**: Pytest (92 tests)

---

## 🔐 Environment Variables

Create a `.env` file:

```env
# AI Service
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Authentication
SECRET_KEY=your-secret-key-change-in-production

# Database
DATABASE_URL=sqlite:///./hikaru.db

# CORS
CORS_ORIGINS=http://localhost:5173

# File Upload
MAX_FILE_SIZE_MB=10
UPLOAD_DIR=./storage
```

---

## 📊 Performance Metrics

- File upload processing: < 2s
- Chart generation: < 3s per chart
- AI insights (all charts): < 8s total
- PDF export: < 5s

---

## 🤝 Contributing

See the main project documentation:
- Development guidelines: [`../CLAUDE.md`](../CLAUDE.md)
- Project status: [`../PROGRESS.md`](../PROGRESS.md)
- Documentation index: [`../DOCUMENTATION_INDEX.md`](../DOCUMENTATION_INDEX.md)
