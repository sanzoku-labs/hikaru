# Hikaru - AI Data Insight Board

Transform CSV and Excel data into interactive BI dashboards with AI-generated insights powered by Claude Sonnet 4.

## Features

### Phase 1: Foundation ✅
- File upload (CSV, Excel) with drag-drop support
- Data preview with schema detection
- Column type inference (numeric, categorical, datetime)

### Upcoming Features
- **Phase 2**: Auto-generated charts (line, pie, bar, scatter)
- **Phase 3**: AI insights per chart + global summary
- **Phase 4**: Natural language Q&A interface
- **Phase 5**: PDF export with professional reports
- **Phase 6**: Testing and polish
- **Phase 7**: Projects feature (multi-file workspaces, comparison, merging)

## Tech Stack

**Backend**:
- FastAPI (Python 3.11+)
- Pandas for data processing
- Anthropic Claude Sonnet 4 for AI insights
- Pydantic for validation

**Frontend**:
- React 18 + TypeScript
- Vite
- shadcn/ui (Radix UI + Tailwind CSS)
- ECharts for visualizations

## Quick Start

### Prerequisites

- **Backend**: Python 3.11+ and Poetry ([installation guide](https://python-poetry.org/docs/#installation))
- **Frontend**: Node.js 18+ and npm

### Backend Setup (Poetry - Recommended)

```bash
cd backend

# Install dependencies with Poetry
poetry install

# Create .env file
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Run server
poetry run uvicorn app.main:app --reload --port 8000

# Or activate Poetry shell first
poetry shell
uvicorn app.main:app --reload --port 8000
```

**Alternative: Backend Setup with pip**

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Run server
uvicorn app.main:app --reload --port 8000
```

Backend will be available at http://localhost:8000

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Install additional dependencies for shadcn/ui
npm install tailwindcss-animate

# Create .env file
cp .env.example .env

# Run development server
npm run dev
```

Frontend will be available at http://localhost:5173

## Project Structure

```
hikaru/
├── backend/               # FastAPI application
│   ├── app/
│   │   ├── api/routes/   # API endpoints
│   │   ├── services/     # Business logic
│   │   └── models/       # Pydantic schemas
│   └── tests/
├── frontend/              # React application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── services/     # API client
│   │   └── types/        # TypeScript interfaces
├── sample-data/           # Test CSV files
└── docs/                  # Documentation
```

## API Endpoints

- `GET /health` - Health check
- `POST /api/upload` - Upload file and get schema analysis

## Development

### Testing

```bash
# Backend tests (Poetry)
cd backend
poetry run pytest

# Backend tests with coverage
poetry run pytest --cov=app --cov-report=html

# Backend tests (pip/venv)
cd backend
source venv/bin/activate
pytest

# Frontend tests (coming in Phase 6)
cd frontend
npm run test
```

### Code Quality (Backend)

```bash
cd backend

# Format code with Black
poetry run black app/

# Lint with Ruff
poetry run ruff check app/

# Type checking with mypy
poetry run mypy app/
```

### Sample Data

Test the application with sample files in `sample-data/`:
- `sales_by_region.csv` - Regional sales data
- `monthly_revenue.csv` - Monthly revenue trends

## Documentation

See `docs/` for comprehensive documentation:
- `DSB_PRD_v1.1.md` - Complete product specification
- `CLAUDE.md` - Development guide for AI assistants
- `DAY_1_QUICK_START.md` - Quick implementation guide

## License

Proprietary - Sanzoku Labs

## Support

For issues and questions, contact: Sanzoku Labs
