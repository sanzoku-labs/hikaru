# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hikaru is a full-stack AI-powered data insight dashboard. Users upload CSV/Excel files, organize them into projects, and get AI-generated charts, insights, and reports. Built with FastAPI (Python) backend and React (TypeScript) frontend.

## Commands

### Backend (run from `backend/`)

```bash
# Development server
poetry run uvicorn app.main:app --reload --port 8000

# Tests
poetry run pytest                                    # all tests
poetry run pytest tests/unit/test_services/          # test directory
poetry run pytest tests/unit/test_services/test_auth_service.py  # single file
poetry run pytest -k "test_create_user"              # single test by name

# Code quality
poetry run black app/                                # format
poetry run ruff check app/                           # lint
poetry run ruff check app/ --fix                     # lint + auto-fix
poetry run mypy app/                                 # type check
poetry run isort app/                                # sort imports

# Database migrations
poetry run alembic upgrade head                      # apply migrations
poetry run alembic revision --autogenerate -m "msg"  # create migration

# Seed database
poetry run python scripts/seed.py --clear            # seed with sample data
```

### Frontend (run from `frontend/`)

```bash
npm run dev       # dev server on http://localhost:5173
npm run build     # typecheck + production build
npm run lint      # eslint
```

### CI

GitHub Actions runs Playwright E2E tests on push/PR to `main`/`develop`. Backend starts on port 8000, frontend on 5173.

## Architecture

### Backend: Layered Service Pattern

```
Routes (app/api/routes/) → Services (app/services/) → Models (app/models/database.py)
```

- **Routes**: HTTP handling, request validation, dependency injection via `Depends()`
- **Services**: Business logic classes (e.g., `ProjectService`, `AuthService`, `AIAssistantService`)
- **Models**: SQLAlchemy ORM models in `database.py`, Pydantic schemas in `schemas.py`
- **Auth**: JWT with bcrypt hashing. Use `get_current_active_user()` dependency for protected routes
- **Exceptions**: Custom `AppException` in `core/exceptions.py` with global handlers
- **Config**: Pydantic Settings in `config.py`, reads from `.env`

Database: SQLite for dev (`hikaru.db`), PostgreSQL-ready via `DATABASE_URL`. Alembic manages migrations.

### Frontend: Pages → Views → Components

```
Pages (lazy-loaded) → Views (feature UI) → Components (shadcn/ui primitives)
```

- **State**: Zustand stores (`authStore`, `assistantStore`, `uiStore`) for client state. TanStack Query v5 for server state with 5min staleTime
- **API layer**: Axios client in `services/axios.ts` with auth interceptors. Hooks split into `services/api/queries/` and `services/api/mutations/`
- **Flow hooks**: Orchestration hooks like `useLoginFlow`, `useProjectDetailFlow` in `hooks/{feature}/` combine state + API + navigation
- **Routing**: React Router v6 with lazy loading and `ProtectedRoute` auth guard
- **Styling**: Tailwind CSS + shadcn/ui (Radix primitives). Components in `components/ui/`
- **Path alias**: `@/*` maps to `src/*`
- **Charts**: ECharts via `echarts-for-react` (lazy-loaded, large bundle)
- **Endpoints**: Centralized API path constants in `services/endpoints.ts`

### Vite Dev Proxy

The frontend dev server proxies `/api` to `http://localhost:8004`. If running backend on port 8000, either change the proxy target in `vite.config.ts` or start the backend on 8004.

## Key Conventions

### Backend
- Line length: 100 chars (black, ruff, isort all configured)
- Ruff rules: E, F, I (errors, pyflakes, isort)
- mypy: strict mode with `ignore_missing_imports`
- isort profile: black
- Test pattern: `tests/unit/test_{feature}/test_{module}.py` with `Test*` classes
- pytest runs with `--cov=app --cov-fail-under=80` by default

### Frontend
- Path imports use `@/` alias (e.g., `import { Button } from '@/components/ui/button'`)
- TypeScript strict mode
- API types defined in `types/api.ts`
- New API endpoints: add constant to `endpoints.ts`, create query/mutation hook, add TypeScript types
