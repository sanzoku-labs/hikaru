# CLAUDE.md

This file provides guidance to AI assistants (like Claude Code) when working with code in this repository.

---

## Project Overview

**Hikaru (Data Smart Board)** is a production-ready AI-powered data analytics dashboard that transforms CSV/Excel files into interactive BI dashboards with AI-generated insights.

**Current Status**: 🚧 **Frontend Rebuild in Progress**

**Backend Status**: ✅ **Production Ready (v1.0.0)**
- ✅ 40+ API endpoints across 10 route modules
- ✅ Service Layer Pattern with 14 services
- ✅ JWT authentication with session tracking
- ✅ Multi-file projects, comparison, merging
- ✅ AI insights with Claude Sonnet 4
- ✅ 253 tests, 55% coverage

**Frontend Status**: ✅ **Week 3 Complete - Multi-file Projects (Phase 1)**
- ✅ Week 1: Foundation + Authentication
- ✅ Week 2: Quick Analysis MVP (upload → charts → export)
- ✅ Week 3: Multi-file Projects (project CRUD, file management)
- 🚧 Week 4: Advanced Project Features (NEXT)

**Next Immediate Steps (Week 4)**:
- ProjectFileAnalysis page (view charts for individual files)
- File comparison view (side-by-side diff)
- File merging functionality (join operations)

**📋 Important Planning Documents**:
- **Frontend Rebuild Plan**: `~/.claude/plans/pure-percolating-moonbeam.md` (8-week roadmap)
- **Backend Analysis**: `~/.claude/plans/hikaru_backend_analysis.md` (40+ endpoints documented)
- **Architecture Blueprint**: `~/.claude/plans/pure-percolating-moonbeam-agent-94b94802.md` (180+ pages)
- **Progress Tracking**: `frontend/README.md` (detailed feature list by week)

---

## Technology Stack

| Component | Technology | Version/Details |
|-----------|------------|-----------------|
| **Backend** | FastAPI | Python 3.13, Poetry package manager |
| **Database** | SQLite | PostgreSQL-ready with SQLAlchemy 2.0 |
| **Data Processing** | Pandas, DuckDB | For CSV/Excel analysis |
| **AI** | Anthropic Claude | Sonnet 4 (claude-sonnet-4-20250514) |
| **Authentication** | JWT + bcrypt | 7-day token expiry, session tracking |
| **PDF Generation** | ReportLab | Professional report exports |
| **Frontend** | React 18.3 + TypeScript 5.6 | Vite 6 with SWC (20x faster) |
| **UI Library** | shadcn/ui | Radix UI + Tailwind CSS 3.4 |
| **State Management** | TanStack Query + Zustand | Server state + Client state |
| **Routing** | React Router v6 | Client-side SPA routing |
| **Forms** | React Hook Form + Zod | Type-safe validation |
| **Charts** | ECharts v5 | Tree-shaken, ~60% smaller bundle |
| **Data Tables** | TanStack Table v8 | Virtualization for 10k+ rows |
| **Testing (Backend)** | Pytest | 253 tests, 55% coverage |
| **Testing (Frontend)** | Vitest (planned) | React Testing Library |

---

## Development Commands

### Backend

```bash
cd backend

# Install dependencies
poetry install

# Activate virtual environment
poetry shell

# Run development server
poetry run uvicorn app.main:app --reload --port 8000

# Run tests
poetry run pytest
poetry run pytest --cov=app                    # With coverage
poetry run pytest tests/unit/test_services/    # Specific suite
poetry run pytest -v -s                        # Verbose with print output

# Code quality
poetry run black app/                          # Format
poetry run ruff check app/                     # Lint
poetry run mypy app/                           # Type check

# Database migrations
poetry run alembic revision --autogenerate -m "description"
poetry run alembic upgrade head
poetry run alembic downgrade -1

# Add dependencies
poetry add package-name
poetry add --group dev package-name
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm run preview                # Preview production build

# Tests (when implemented)
npm run test
npm run test:coverage
```

---

## Project Structure

```
hikaru/
├── backend/                         # FastAPI application
│   ├── app/
│   │   ├── main.py                 # FastAPI app instance + CORS config
│   │   ├── config.py               # Pydantic Settings for env vars
│   │   │
│   │   ├── api/                    # API layer (thin controllers)
│   │   │   ├── dependencies.py    # Dependency injection (get_db, get_current_user)
│   │   │   └── routes/            # 8 route modules, 25+ endpoints
│   │   │       ├── upload.py      # POST /api/upload
│   │   │       ├── analyze.py     # POST /api/analyze/{upload_id}
│   │   │       ├── export.py      # POST /api/export
│   │   │       ├── query.py       # POST /api/query (Q&A chat)
│   │   │       ├── auth.py        # POST /api/auth/register|login|logout
│   │   │       ├── projects.py    # CRUD for projects + file upload
│   │   │       ├── dashboards.py  # Dashboard management
│   │   │       └── merge.py       # File comparison + merging
│   │   │
│   │   ├── services/              # Business logic (Service Layer Pattern)
│   │   │   ├── ai_service.py            # Claude API integration (insights, Q&A)
│   │   │   ├── analysis_service.py      # Chart generation orchestration
│   │   │   ├── auth_service.py          # User registration, login, sessions
│   │   │   ├── cache_service.py         # In-memory caching (24hr TTL)
│   │   │   ├── chart_generator.py       # Chart heuristics engine
│   │   │   ├── data_processor.py        # Pandas operations, schema detection
│   │   │   ├── project_service.py       # Project CRUD operations
│   │   │   └── upload_service.py        # File upload handling
│   │   │
│   │   ├── models/                # Data models
│   │   │   ├── database.py       # SQLAlchemy ORM models (8 tables)
│   │   │   └── schemas.py        # Pydantic request/response models (30+)
│   │   │
│   │   ├── core/                  # Core functionality
│   │   │   ├── exceptions.py            # Custom exception classes
│   │   │   └── exception_handlers.py    # Global error handlers
│   │   │
│   │   └── storage.py             # File storage utilities
│   │
│   ├── alembic/                   # Database migrations
│   ├── tests/                     # Test suite (253 tests, 55% coverage)
│   │   └── unit/
│   │       ├── test_api/
│   │       ├── test_core/
│   │       └── test_services/
│   ├── storage/                   # Uploaded files (gitignored)
│   ├── pyproject.toml             # Poetry dependencies
│   └── .env                       # Environment variables (gitignored)
│
├── frontend/                      # React application (NEW - Rebuilding)
│   ├── src/
│   │   ├── main.tsx              # Entry point with QueryClient
│   │   ├── App.tsx               # Router with lazy loaded pages
│   │   │
│   │   ├── pages/                # Route components (lazy loaded)
│   │   │   ├── auth/
│   │   │   │   ├── Login.tsx             # ✅ DONE
│   │   │   │   └── Register.tsx          # ✅ DONE
│   │   │   ├── quick-analysis/
│   │   │   │   └── QuickAnalysis.tsx     # ⏳ TODO
│   │   │   ├── projects/
│   │   │   │   ├── ProjectsList.tsx      # ⏳ TODO
│   │   │   │   ├── ProjectDetail.tsx     # ⏳ TODO
│   │   │   │   ├── FileAnalysis.tsx      # ⏳ TODO
│   │   │   │   ├── FileComparison.tsx    # ⏳ TODO
│   │   │   │   └── FileMerge.tsx         # ⏳ TODO
│   │   │   ├── dashboards/               # ⏳ TODO
│   │   │   └── analytics/                # ⏳ TODO
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                       # shadcn/ui primitives
│   │   │   │   ├── button.tsx            # ✅ DONE
│   │   │   │   ├── input.tsx             # ✅ DONE
│   │   │   │   ├── label.tsx             # ✅ DONE
│   │   │   │   ├── card.tsx              # ✅ DONE
│   │   │   │   └── ... (more to add)     # ⏳ TODO
│   │   │   ├── layout/
│   │   │   │   ├── ProtectedRoute.tsx    # ✅ DONE
│   │   │   │   ├── AppLayout.tsx         # ⏳ NEXT
│   │   │   │   ├── Sidebar.tsx           # ⏳ NEXT
│   │   │   │   └── Header.tsx            # ⏳ NEXT
│   │   │   ├── charts/                   # ⏳ TODO (ChartCard, etc.)
│   │   │   ├── data/                     # ⏳ TODO (DataTable, etc.)
│   │   │   ├── upload/                   # ⏳ TODO (FileUploader)
│   │   │   └── ... (more categories)
│   │   │
│   │   ├── services/
│   │   │   ├── api/
│   │   │   │   ├── queries/              # TanStack Query GET hooks
│   │   │   │   └── mutations/            # TanStack Query mutations
│   │   │   │       ├── useLogin.ts       # ✅ DONE
│   │   │   │       ├── useRegister.ts    # ✅ DONE
│   │   │   │       └── useLogout.ts      # ✅ DONE
│   │   │   ├── axios.ts                  # ✅ DONE (JWT interceptors)
│   │   │   └── endpoints.ts              # ✅ DONE (API constants)
│   │   │
│   │   ├── stores/                       # Zustand client state
│   │   │   ├── authStore.ts              # ✅ DONE
│   │   │   ├── uiStore.ts                # ⏳ NEXT (sidebar, theme)
│   │   │   └── ... (more stores)
│   │   │
│   │   ├── types/
│   │   │   └── api.ts                    # ✅ DONE (from backend schemas)
│   │   │
│   │   ├── lib/
│   │   │   └── utils.ts                  # ✅ DONE (cn, formatters)
│   │   │
│   │   └── styles/
│   │       └── globals.css               # ✅ DONE (Tailwind + CSS vars)
│   │
│   ├── public/                           # Static assets
│   ├── dist/                             # Production build (gitignored)
│   ├── vite.config.ts                    # ✅ DONE (SWC, code splitting)
│   ├── tailwind.config.ts                # ✅ DONE (design tokens)
│   ├── tsconfig.json                     # ✅ DONE (strict mode)
│   ├── package.json                      # ✅ DONE (325 deps)
│   └── README.md                         # ✅ DONE (progress tracker)
│
├── docs/                          # Historical documentation (archived)
│   └── archive/
│       ├── completed/            # Phase completion reports
│       ├── features/             # Feature guides
│       └── ...                   # Original planning docs
│
├── PROGRESS.md                    # Current project status tracker
├── CLAUDE.md                      # This file
└── README.md                      # Project overview + quick start
```

---

## Architecture Overview

### Backend Architecture

```
┌─────────────────────────────────────────────────────┐
│                  FastAPI Application                 │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │ API Layer (routes/)                        │    │
│  │ - Thin controllers                         │    │
│  │ - Request validation (Pydantic)            │    │
│  │ - Response serialization                   │    │
│  └──────────────┬─────────────────────────────┘    │
│                 │                                    │
│                 ▼                                    │
│  ┌────────────────────────────────────────────┐    │
│  │ Service Layer (services/)                  │    │
│  │ - Business logic                           │    │
│  │ - Data processing (Pandas)                 │    │
│  │ - AI integration (Claude API)              │    │
│  │ - Chart generation                         │    │
│  └──────────────┬─────────────────────────────┘    │
│                 │                                    │
│                 ▼                                    │
│  ┌────────────────────────────────────────────┐    │
│  │ Data Layer (models/)                       │    │
│  │ - SQLAlchemy ORM models                    │    │
│  │ - Database operations                      │    │
│  │ - File storage (storage.py)                │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Key Pattern**: Service Layer Pattern
- Routes handle HTTP concerns only
- Services contain all business logic
- Models handle data persistence
- Clean separation of concerns

### Frontend Architecture (NEW - 2025 Best Practices)

```
┌─────────────────────────────────────────────────────┐
│              React Application (NEW)                 │
├─────────────────────────────────────────────────────┤
│                                                      │
│  PRESENTATION LAYER                                 │
│  ├── Pages (lazy loaded routes)                    │
│  └── Components (shadcn/ui + custom)                │
│                 ↓                                    │
│  STATE MANAGEMENT LAYER                             │
│  ├── TanStack Query (server state - API cache)     │
│  │   ├── Queries (GET requests)                    │
│  │   └── Mutations (POST/PUT/DELETE)               │
│  └── Zustand (client state - UI, auth)             │
│                 ↓                                    │
│  API CLIENT LAYER                                   │
│  ├── axios.ts (JWT interceptors)                   │
│  └── endpoints.ts (constants)                      │
│                 ↓                                    │
│  BACKEND API (FastAPI - 40+ endpoints)             │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Key Patterns**:
- **Service Layer Pattern**: TanStack Query for server state, Zustand for client state
- **Code Splitting**: All routes lazy loaded with React.lazy()
- **Type Safety**: TypeScript strict mode, types mirror backend Pydantic schemas
- **Performance**: Tree-shaken imports, manual code chunks, <110kB gzipped initial bundle
- **Auth Flow**: JWT in localStorage, automatic token injection via axios interceptors
- **Form Handling**: React Hook Form + Zod validation

---

## Key Features & Implementation

### 1. Chart Generation Heuristics

**Location**: `backend/app/services/chart_generator.py`

**How it works**: Priority-based automatic chart selection

| Priority | Data Pattern | Chart Type | Implementation |
|----------|--------------|------------|----------------|
| 1 | 1 datetime + 1 numeric | Line Chart | `_try_line_chart()` |
| 2 | 1 categorical (≤8 values) + 1 numeric | Pie Chart | `_try_pie_chart()` |
| 3 | 1 categorical + 1 numeric | Bar Chart | `_try_bar_chart()` |
| 4 | 2+ numeric columns | Scatter Plot | `_try_scatter()` |

**Algorithm**:
1. Detect column types (numeric, categorical, datetime)
2. Iterate through column combinations
3. Apply priority rules in order
4. Generate 3-4 charts maximum
5. Return chart configurations (ECharts format)

### 2. AI Integration Strategy

**Location**: `backend/app/services/ai_service.py`

**Model**: Claude Sonnet 4 (`claude-sonnet-4-20250514`)

**Use Cases**:
- **Per-chart insights**: 2-3 sentence analysis of individual charts
- **Global summary**: 3-4 sentence overview of entire dataset
- **Q&A chat**: Natural language question answering

**Caching**:
- In-memory cache with 24-hour TTL
- Cache key: `hash(filename + file_size + timestamp_day)`
- Reduces API costs by ~60%

**Error Handling**:
- Always show charts even if AI fails
- Graceful degradation (display charts without insights)
- Never block user workflow on AI errors

### 3. Authentication Flow

**Location**: `backend/app/services/auth_service.py`, `backend/app/api/routes/auth.py`

**Flow**:
```
Registration:
1. User submits email/username/password
2. Backend validates password requirements
3. Backend hashes password with bcrypt
4. Backend creates User record
5. Backend generates JWT token
6. Backend creates Session record
7. Frontend stores token in localStorage

Login:
1. User submits username/email + password
2. Backend finds user by username or email
3. Backend verifies password with bcrypt
4. Backend generates JWT token (7-day expiry)
5. Backend creates Session record
6. Frontend stores token in localStorage

Protected Requests:
1. Frontend includes token in Authorization header
2. Backend validates token signature
3. Backend checks session not revoked
4. Backend extracts user_id from token
5. Request proceeds with authenticated user context

Logout:
1. Frontend sends logout request with token
2. Backend marks session as revoked
3. Frontend clears localStorage
4. User redirected to login
```

### 4. Project File Management

**Location**: `backend/app/services/project_service.py`, `backend/app/api/routes/projects.py`

**Storage Structure**:
```
storage/
├── {project_id_1}/
│   ├── {file_id_1}.csv
│   ├── {file_id_2}.csv
│   └── {file_id_3}.xlsx
└── {project_id_2}/
    ├── {file_id_4}.csv
    └── {file_id_5}.csv
```

**Benefits**:
- Easy project cleanup (delete folder)
- Better organization
- User isolation (project owner only)

### 5. File Comparison

**Location**: `backend/app/api/routes/merge.py`

**How it works**:
1. Load both DataFrames
2. Detect common columns
3. Generate diff statistics (rows added/removed/modified)
4. Create side-by-side preview
5. Highlight differences visually

### 6. File Merging

**Location**: `backend/app/api/routes/merge.py`

**How it works**:
1. User selects join type (inner, left, right, outer)
2. User maps join keys (e.g., `customer_id` ↔ `id`)
3. Backend executes `pd.merge()`
4. Backend generates charts from merged DataFrame
5. AI provides insights on merged data

---

## Common Development Tasks

### Add a New API Endpoint

1. **Create route** in `backend/app/api/routes/`:
```python
# backend/app/api/routes/my_feature.py
from fastapi import APIRouter, Depends
from app.api.dependencies import get_current_user
from app.models.schemas import MyRequest, MyResponse

router = APIRouter()

@router.post("/my-feature", response_model=MyResponse)
async def my_feature(
    request: MyRequest,
    current_user = Depends(get_current_user)
):
    # Implementation
    return MyResponse(...)
```

2. **Register route** in `backend/app/main.py`:
```python
from app.api.routes import my_feature
app.include_router(my_feature.router, prefix="/api", tags=["my-feature"])
```

3. **Add Pydantic schemas** in `backend/app/models/schemas.py`:
```python
class MyRequest(BaseModel):
    field: str

class MyResponse(BaseModel):
    result: str
```

4. **Add tests** in `backend/tests/unit/test_api/`:
```python
def test_my_feature(client, auth_headers):
    response = client.post(
        "/api/my-feature",
        json={"field": "value"},
        headers=auth_headers
    )
    assert response.status_code == 200
```

### Add a New Frontend Page

1. **Create page component** in `frontend/src/pages/`:
```tsx
// frontend/src/pages/MyPage.tsx
export function MyPage() {
  return (
    <div>
      <h1>My Page</h1>
    </div>
  )
}
```

2. **Add route** in `frontend/src/main.tsx`:
```tsx
import { MyPage } from './pages/MyPage'

const router = createBrowserRouter([
  // ... existing routes
  {
    path: '/my-page',
    element: <MyPage />
  }
])
```

3. **Add to navigation** (if needed) in relevant component

### Add a New Service

1. **Create service** in `backend/app/services/`:
```python
# backend/app/services/my_service.py
class MyService:
    def __init__(self, db: Session):
        self.db = db
    
    def do_something(self, data: dict) -> dict:
        # Business logic here
        return {"result": "success"}
```

2. **Use in route**:
```python
from app.services.my_service import MyService

@router.post("/endpoint")
async def endpoint(db: Session = Depends(get_db)):
    service = MyService(db)
    result = service.do_something(data)
    return result
```

3. **Add tests** in `backend/tests/unit/test_services/`:
```python
def test_my_service():
    service = MyService(db)
    result = service.do_something({"key": "value"})
    assert result["result"] == "success"
```

---

## Testing Strategy

### Backend Tests

**Location**: `backend/tests/`

**Current Status**: 253 tests, 55% coverage

**Test Organization**:
```
tests/
└── unit/
    ├── test_api/           # API endpoint tests
    ├── test_core/          # Core functionality tests
    └── test_services/      # Service layer tests
```

**Running Tests**:
```bash
poetry run pytest                           # All tests
poetry run pytest --cov=app                 # With coverage
poetry run pytest tests/unit/test_services/ # Specific suite
poetry run pytest -v -s                     # Verbose
poetry run pytest -k "test_name"            # Specific test
```

**Writing Tests**:
```python
# backend/tests/unit/test_services/test_my_service.py
import pytest
from app.services.my_service import MyService

def test_my_service_success(db_session):
    service = MyService(db_session)
    result = service.do_something({"key": "value"})
    assert result["success"] is True

def test_my_service_error(db_session):
    service = MyService(db_session)
    with pytest.raises(ValueError):
        service.do_something({"invalid": "data"})
```

### Frontend Tests (To Be Implemented)

**Planned Stack**: Vitest + React Testing Library

---

## Environment Variables

### Backend (.env)

```env
# AI Service
ANTHROPIC_API_KEY=sk-ant-your-key-here
ANTHROPIC_MODEL=claude-sonnet-4-20250514
AI_CACHE_TTL_HOURS=24

# Authentication
SECRET_KEY=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_DAYS=7

# Database
DATABASE_URL=sqlite:///./hikaru.db
# For PostgreSQL: postgresql://user:pass@localhost/hikaru

# Server
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=http://localhost:5173

# File Upload
MAX_FILE_SIZE_MB=10
ALLOWED_EXTENSIONS=csv,xlsx
UPLOAD_DIR=./storage
FILE_RETENTION_HOURS=1

# Security
RATE_LIMIT_PER_MINUTE=100
```

### Frontend (.env)

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000
```

---

## Performance Targets

All targets have been met:

- ✅ File upload processing: < 2s
- ✅ Chart generation: < 3s per chart
- ✅ AI insights (all charts + summary): < 8s total
- ✅ PDF export: < 5s
- ✅ **Total end-to-end flow**: < 15s

**Optimization Techniques Used**:
- DuckDB for large dataset queries (faster than Pandas)
- AI response caching (24-hour TTL)
- Lazy chart rendering
- Efficient DataFrame operations
- Minimal re-renders in React

---

## Security Considerations

### Implemented Security Measures

1. **Authentication**:
   - JWT tokens with 7-day expiry
   - bcrypt password hashing (irreversible)
   - Session tracking with server-side revocation

2. **Authorization**:
   - All endpoints (except auth) require valid JWT
   - User isolation (users only see their own data)
   - Project ownership validation

3. **File Upload Security**:
   - File size validation (max 30MB)
   - Extension whitelist (CSV, XLSX only)
   - Content validation (malformed file detection)
   - CSV injection protection (sanitize `=`, `+`, `-`, `@` prefixes)

4. **API Security**:
   - CORS whitelist (frontend origin only)
   - Rate limiting (100 requests/minute)
   - Input validation (Pydantic models)
   - Error message sanitization (no stack traces to client)

5. **Database Security**:
   - Parameterized queries (SQLAlchemy ORM)
   - No raw SQL execution
   - Connection pooling

---

## Common Issues & Solutions

### "ANTHROPIC_API_KEY not found"

**Issue**: AI insights not generating  
**Solution**: Charts still work, but insights disabled. Add API key to `backend/.env`

### "Could not validate credentials"

**Issue**: 401 error on protected endpoints  
**Solution**: Token expired or invalid. Log in again.

### "Port 8000 already in use"

**Issue**: Cannot start backend  
**Solution**: 
```bash
lsof -ti:8000 | xargs kill -9  # macOS/Linux
# Or change PORT in backend/.env
```

### "Module not found" (Backend)

**Issue**: Import errors  
**Solution**:
```bash
cd backend
poetry install
```

### "Cannot connect to backend" (Frontend)

**Issue**: API calls failing  
**Solution**: Verify backend running at http://localhost:8000/docs

### Database migration conflicts

**Issue**: Alembic migration errors  
**Solution**:
```bash
cd backend
rm hikaru.db alembic/versions/*.py
poetry run alembic revision --autogenerate -m "initial"
poetry run alembic upgrade head
```

---

## Code Quality Standards

### Backend

- **Formatting**: Black (line length 100)
- **Linting**: Ruff
- **Type Checking**: mypy (strict mode)
- **Testing**: Pytest (aim for 80%+ coverage)
- **Documentation**: Docstrings for public functions

### Frontend

- **Language**: TypeScript (strict mode)
- **Formatting**: Prettier
- **Linting**: ESLint
- **Components**: Functional components only (no class components)
- **State**: React hooks (useState, useEffect, etc.)

---

## Where to Find Things

### "I need to..."

**Add a new AI prompt**:
- Edit `backend/app/services/ai_service.py`
- Methods: `generate_chart_insight()`, `generate_global_summary()`, `answer_question()`

**Change chart generation logic**:
- Edit `backend/app/services/chart_generator.py`
- Methods: `_try_line_chart()`, `_try_pie_chart()`, `_try_bar_chart()`, `_try_scatter()`

**Modify authentication flow**:
- Edit `backend/app/services/auth_service.py`
- Edit `backend/app/api/routes/auth.py`

**Add a new database table**:
1. Edit `backend/app/models/database.py` (add SQLAlchemy model)
2. Run `poetry run alembic revision --autogenerate -m "add_table"`
3. Run `poetry run alembic upgrade head`

**Add a new UI component**:
- Create in `frontend/src/components/`
- Use shadcn/ui primitives from `frontend/src/components/ui/`

**Change file upload limits**:
- Edit `MAX_FILE_SIZE_MB` in `backend/.env`
- Edit validation in `backend/app/api/routes/upload.py`

**Modify PDF export layout**:
- Edit `backend/app/api/routes/export.py`
- ReportLab code in `generate_pdf()` function

---

## Current Work & Next Steps

**🚧 Active: Frontend Rebuild - Week 4 (Advanced Project Features)**

**✅ Completed**:
- ✅ Week 1: Foundation + Authentication (login, register, protected routes)
- ✅ Week 2: Quick Analysis MVP (upload → charts → AI insights → PDF export)
- ✅ Week 3: Multi-file Projects Phase 1 (project CRUD, file management, upload)

**🚧 Next (Week 4 - Advanced Project Features)**:
1. ProjectFileAnalysis page (view charts for individual project files)
2. File comparison view (side-by-side diff, statistics)
3. File merging functionality (join operations, key mapping)
4. Project dashboard with aggregated insights
5. Batch file operations

**Current Build Status**:
- Production bundle: 171 kB gzipped (66% under 500kB target)
- All routes lazy-loaded and code-split
- TypeScript strict mode passing
- Mobile responsive on all pages

**📋 Planning Documents Reference**:
- **8-Week Roadmap**: `~/.claude/plans/pure-percolating-moonbeam.md`
- **Backend API Docs**: `~/.claude/plans/hikaru_backend_analysis.md` (40+ endpoints)
- **Architecture**: `~/.claude/plans/pure-percolating-moonbeam-agent-94b94802.md` (180+ pages)
- **Progress Tracking**: `frontend/README.md` (detailed feature checklist)

**Later Phases**:
- Phase 3: Chat + Advanced features (Week 5-6)
- Phase 4: Dashboards + Analytics (Week 7)
- Phase 5: Performance + Polish (Week 8)
- Phase 6+: Testing, Deployment

---

## Important Notes for AI Assistants

1. **Always run tests** after making backend changes: `poetry run pytest`
2. **Always build** after making frontend changes: `npm run build`
3. **Use Service Layer Pattern** for new business logic (don't put logic in routes)
4. **Follow existing code style** (Black for Python, Prettier for TypeScript)
5. **Add tests** for new features (don't decrease coverage)
6. **Update PROGRESS.md** when completing major work
7. **Don't commit** `.env`, `hikaru.db`, `storage/`, `node_modules/`, `dist/`

---

**Last Updated**: November 27, 2025
**Maintained By**: Sanzoku Labs
**For Questions**: See README.md or frontend/README.md
