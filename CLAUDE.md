# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Hikaru (Data Smart Board)** is an AI-powered data analytics dashboard that transforms CSV/Excel files into interactive BI dashboards with AI-generated insights. Think of it as a simplified, intelligent alternative to Power BI or Tableau, designed for non-technical users.

**Current Status**: Pre-development (Phase 0) - This repository currently contains only comprehensive documentation. No source code has been implemented yet. All specifications, API designs, and UI mockups are ready for development.

**Technology Stack**:
- **Backend**: FastAPI (Python 3.11+), Pandas, DuckDB, Anthropic Claude Sonnet 4
- **Frontend**: React 18 + TypeScript, Vite, shadcn/ui, Tailwind CSS, ECharts v5
- **Testing**: Pytest (backend), Vitest (frontend), Playwright/Cypress (E2E)
- **Database**: SQLite (MVP) → PostgreSQL (post-MVP)

## Development Commands

### Initial Setup (When Implementing)

```bash
# Backend setup
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env file with required variables:
# - ANTHROPIC_API_KEY
# - MAX_FILE_SIZE_MB=10
# - CORS_ORIGINS=http://localhost:5173

# Start development server
uvicorn app.main:app --reload --port 8000
```

```bash
# Frontend setup
cd frontend
npm install

# Initialize shadcn/ui
npx shadcn-ui@latest init

# Add required components
npx shadcn-ui@latest add button card input table badge alert skeleton dialog

# Create .env file with:
# - VITE_API_BASE_URL=http://localhost:8000

# Start development server
npm run dev
```

### Testing Commands

```bash
# Backend tests
cd backend
pytest                          # Run all tests
pytest tests/test_upload.py     # Run specific test file
pytest -v -s                    # Verbose output with print statements
pytest --cov=app --cov-report=html  # Coverage report

# Frontend tests
cd frontend
npm run test                    # Run Vitest
npm run test:ui                 # Interactive UI
npm run test:coverage           # Coverage report

# E2E tests
npm run test:e2e                # Run Playwright/Cypress tests
```

### Build Commands

```bash
# Backend (no build step - interpreted Python)
python -m pytest  # Validate before deployment

# Frontend
cd frontend
npm run build     # Production build to dist/
npm run preview   # Preview production build
```

## Architecture Overview

### Project Structure

```
hikaru/
├── backend/               # FastAPI application (to be created)
│   ├── app/
│   │   ├── main.py       # FastAPI app instance
│   │   ├── api/routes/   # API endpoints
│   │   ├── services/     # Business logic (data processing, chart generation, AI)
│   │   └── models/       # Pydantic schemas
│   ├── tests/
│   └── requirements.txt
├── frontend/              # React application (to be created)
│   ├── src/
│   │   ├── components/   # shadcn/ui components + custom components
│   │   ├── lib/          # Utilities and API client
│   │   └── App.tsx       # Main app component
│   ├── public/
│   └── package.json
└── docs/                  # Comprehensive specifications (current)
    ├── README.md          # Quick start guide
    ├── DSB_PRD_v1.1.md    # Master specification (77KB)
    ├── CLAUDE_CODE_PROMPT.md  # Ready-to-paste implementation guide
    ├── DAY_1_QUICK_START.md   # 4-hour implementation checklist
    └── PROJECTS_FEATURE_OVERVIEW.md  # Post-MVP features
```

### System Architecture

```
┌─────────────────────────────────────────────┐
│         Frontend (React + TypeScript)        │
│  ┌────────┬─────────┬──────┬───────────┐   │
│  │ Upload │ Charts  │ Q&A  │  Export   │   │
│  │ (shadcn)│ (ECharts)│ Chat │  (PDF)    │   │
│  └────────┴─────────┴──────┴───────────┘   │
│              ↓ HTTP/REST                     │
└─────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────┐
│          Backend (FastAPI)                   │
│  ┌──────────────────────────────────────┐  │
│  │ API Routes                            │  │
│  │ /upload /analyze /query /export      │  │
│  └──────────────────────────────────────┘  │
│        ↓              ↓            ↓        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │  Pandas  │  │  Chart   │  │ Claude   │ │
│  │  DuckDB  │  │Generator │  │   API    │ │
│  └──────────┘  └──────────┘  └──────────┘ │
│        ↓                                    │
│  ┌──────────────────────────────────────┐  │
│  │ SQLite (MVP) / Postgres (Later)      │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### Core Design Patterns

**API-First Design**:
- All endpoints use Pydantic models for request/response validation
- Type-safe contracts between frontend and backend
- OpenAPI/Swagger documentation auto-generated
- Complete API specifications available in `docs/DSB_PRD_v1.1.md` (Section 8)

**Service Layer Pattern** (Backend):
```python
app/
├── api/routes/          # FastAPI endpoints (thin controllers)
│   ├── upload.py
│   ├── analyze.py
│   └── export.py
├── services/            # Business logic (core functionality)
│   ├── data_processor.py    # Pandas/DuckDB operations
│   ├── chart_generator.py   # Chart selection heuristics
│   └── ai_service.py         # Claude API integration
└── models/schemas.py    # Pydantic models
```

**Component-Based UI** (Frontend):
- shadcn/ui components copied into project (not npm dependencies)
- Full customization control with Tailwind CSS
- Radix UI primitives for accessibility
- Key components: FileUploader, DataPreview, ChartCard, ExportModal

**Progressive Enhancement**:
- Application works without AI (shows charts without insights)
- Graceful degradation on API failures
- Background jobs for heavy operations (PDF exports)
- Optimistic UI updates with loading states

## Key Development Workflows

### Data Processing Pipeline

```
Upload → Validate → Parse → Analyze → Store
  ↓         ↓         ↓        ↓        ↓
File     Size/Type  Pandas  Schema   SQLite
Check    Check      Read    Detect   Save
```

**Validation Steps**:
1. File size check (max 10MB for MVP)
2. File type check (CSV, XLSX only)
3. Content validation (readable format, valid encoding)
4. Schema detection (numeric/categorical/datetime columns)

### Chart Generation Heuristics

The system uses **priority-based automatic chart selection**. This is critical to understand:

| Priority | Data Pattern | Chart Type | Example Use Case |
|----------|--------------|------------|------------------|
| 1 | 1 datetime + 1 numeric | Line Chart | Monthly revenue trend |
| 2 | 1 categorical (≤8 values) + 1 numeric | Pie Chart | Market share by segment |
| 3 | 1 categorical + 1 numeric | Bar Chart | Sales by region |
| 4 | 2+ numeric columns | Scatter Plot | Price vs quantity correlation |

**Implementation Logic** (detailed in `docs/DSB_PRD_v1.1.md` Section 5):
- Iterate through column combinations
- Apply priority rules in order
- Generate 3-4 charts maximum (performance target)
- Include title, axis labels, and data summaries

### AI Integration Strategy

**Model**: Claude Sonnet 4 (cost-effective, fast, accurate)

**Prompt Templates** (see `docs/DSB_PRD_v1.1.md` Section 6):
- Per-chart insights: "Analyze this {chart_type} showing {description}..."
- Global summary: "Summarize these key findings from the dataset..."
- Q&A responses: "Given this data context, answer: {user_question}..."

**Caching Strategy**:
- Cache insights for 24 hours (reduces API costs by ~60%)
- Cache key: `hash(filename + file_size + timestamp_day)`
- Invalidate on file re-upload

**Error Handling**:
- Always show charts even if AI fails
- Display friendly error message: "Insights temporarily unavailable"
- Log failures for debugging
- Never block user workflow on AI errors

### 6-Phase Development Roadmap

**Phase 1: Foundation** (Week 1)
- File upload (drag-drop + click)
- CSV/XLSX parsing with Pandas
- Schema detection
- Data preview table (first 10 rows)
- **Deliverable**: Working upload + preview in < 2 seconds

**Phase 2: Chart Generation** (Week 2)
- Implement chart heuristics engine
- ECharts integration
- Auto-generate 3-4 charts
- Responsive grid layout
- **Deliverable**: Charts render in < 3 seconds per chart

**Phase 3: AI Insights** (Week 3)
- Claude API integration
- Per-chart insights (2-3 sentences)
- Global summary (3-4 sentences)
- Confidence indicators
- **Deliverable**: 90%+ coherent insights in < 8 seconds total

**Phase 4: Interactive Q&A** (Week 4)
- Natural language query interface
- Context-aware responses using Claude
- Dynamic chart updates based on queries
- Question suggestions (e.g., "What are the trends?")
- **Deliverable**: Conversational insights

**Phase 5: PDF Export** (Week 5)
- WeasyPrint integration
- Professional report layout (company branding)
- Chart rendering to high-res images
- Download link with expiry
- **Deliverable**: PDF generation in < 5 seconds

**Phase 6: Polish & Testing** (Week 6)
- Comprehensive error handling
- Loading states and skeleton components
- Responsive design (mobile/tablet/desktop)
- Accessibility compliance (WCAG 2.1 AA)
- Performance optimization
- **Deliverable**: End-to-end flow < 15 seconds total

## Performance Targets

These are critical success metrics defined in the PRD:

- **File upload**: < 2 seconds
- **Chart generation**: < 3 seconds per chart
- **AI insights (all charts + summary)**: < 8 seconds total
- **PDF export**: < 5 seconds
- **Total end-to-end (upload → export)**: < 15 seconds

**Optimization Strategies**:
- Use DuckDB for large dataset queries (faster than Pandas)
- Implement AI response caching (24-hour TTL)
- Background jobs for PDF generation
- Lazy load charts (render on scroll)
- Compress uploaded files in transit

## Security Considerations

**File Upload Security**:
- Validate file size (max 10MB)
- Validate file extensions (`.csv`, `.xlsx` only)
- Validate file content (reject malformed files)
- Scan for CSV injection attacks (cells starting with `=`, `+`, `-`, `@`)
- Use temporary storage with 1-hour auto-cleanup

**API Security**:
- CORS configuration (whitelist frontend origin)
- Rate limiting (100 requests/minute per IP)
- Environment variables for secrets (never commit `.env`)
- HTTPS only (TLS 1.3)
- Input validation on all endpoints (Pydantic)

**Data Privacy**:
- No persistent storage unless user explicitly saves (post-MVP feature)
- Auto-delete uploaded files after 1 hour
- No telemetry or analytics in MVP
- Clear data retention policy in UI

## Documentation Guide

### Where to Find Specifications

**API Specifications** → `docs/DSB_PRD_v1.1.md` (Section 8)
- Complete request/response schemas
- Pydantic model definitions
- Error response formats
- Example curl commands

**UI Component Specifications** → `docs/DSB_PRD_v1.1.md` (Section 9)
- shadcn/ui component usage
- Tailwind CSS classes
- Responsive breakpoints
- Accessibility requirements

**AI Prompt Templates** → `docs/DSB_PRD_v1.1.md` (Section 6)
- Per-chart insight prompts
- Global summary prompts
- Q&A conversation prompts
- System instructions for Claude

**Chart Heuristics Logic** → `docs/DSB_PRD_v1.1.md` (Section 5)
- Priority-based selection algorithm
- Column type detection rules
- Chart configuration examples
- Edge case handling

### Quick Start Guides

**4-Hour Quick Start** → `docs/DAY_1_QUICK_START.md`
- Step-by-step checklist for Phase 1
- Troubleshooting common issues
- Success criteria validation
- **Best for**: Immediate hands-on implementation

**Ready-to-Paste Code** → `docs/CLAUDE_CODE_PROMPT.md`
- Complete backend code examples (FastAPI endpoints)
- Complete frontend code examples (React components)
- Sample CSV data for testing
- **Best for**: Generating initial project scaffold

**Comprehensive Navigation** → `docs/HOW_TO_USE_THESE_DOCS.md`
- Document relationships matrix
- When to use which document
- Reading order recommendations
- **Best for**: Understanding documentation structure

**Post-MVP Features** → `docs/PROJECTS_FEATURE_OVERVIEW.md`
- Multi-file workspace architecture
- File comparison and merging
- Database schema for projects
- Implementation timeline (4 weeks post-MVP)

### Reading Recommendations

**For Initial Implementation**:
1. Read: `docs/DAY_1_QUICK_START.md` (10 min)
2. Copy: `docs/CLAUDE_CODE_PROMPT.md` → Claude Code (generates scaffold)
3. Reference: `docs/DSB_PRD_v1.1.md` (as needed for details)

**For Specific Features**:
- File upload → PRD Section 4.1 + Section 8.1 (API spec)
- Chart generation → PRD Section 5 (heuristics) + Section 8.2
- AI insights → PRD Section 6 (prompts) + Section 8.3
- PDF export → PRD Section 4.5 + Section 8.4

**For Architecture Decisions**:
- Overall vision → `docs/README.md` Section 2
- Technical stack → PRD Section 3
- Database schema → PRD Section 7
- Deployment → PRD Section 11 (post-MVP)

## Important Implementation Notes

### Error Handling Strategy

**Backend** (see PRD Section 10):
- HTTP 400 for client errors (invalid file, malformed request)
- HTTP 500 for server errors (AI API failure, database error)
- Always return structured JSON: `{"error": "message", "details": {...}}`
- Clean up resources (temp files) on all error paths

**Frontend**:
- Display user-friendly error messages (never show stack traces)
- Use shadcn/ui Alert components for errors
- Provide actionable recovery steps (e.g., "Try a smaller file")
- Log detailed errors to console for debugging

### Testing Strategy

**Unit Tests** (80% coverage target):
- Data processing functions (Pandas operations)
- Chart heuristics engine (all priority rules)
- File validation logic
- Pydantic model serialization

**Integration Tests**:
- API endpoints (request → response)
- Database operations (CRUD)
- AI service integration (mock Claude API)

**E2E Tests** (critical user flows):
- Upload CSV → view charts → get insights → export PDF
- Error scenarios (invalid file, large file, AI failure)
- Responsive design (mobile, tablet, desktop)

### shadcn/ui Component Usage

**File Uploader Pattern**:
```tsx
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// Drag-drop area with click-to-upload fallback
// Show file validation errors using Alert component
```

**Data Preview Table**:
```tsx
import { Table } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

// Display column types with Badge (numeric/categorical/datetime)
// Show first 10 rows with "Load more" button
```

**Chart Card**:
```tsx
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// ECharts component + AI insight text below
// Loading state with Skeleton component
```

**Export Modal**:
```tsx
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

// Format selection (PDF only in MVP)
// Progress indicator during generation
// Download button when ready
```

## Environment Variables

### Backend (.env)

```env
# Server Configuration
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=http://localhost:5173

# File Upload Settings
MAX_FILE_SIZE_MB=10
ALLOWED_EXTENSIONS=csv,xlsx
UPLOAD_DIR=./uploads
FILE_RETENTION_HOURS=1

# AI Integration
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-20250514
AI_CACHE_TTL_HOURS=24

# Database
DATABASE_URL=sqlite:///./hikaru.db

# Security
SECRET_KEY=your-secret-key-here
RATE_LIMIT_PER_MINUTE=100
```

### Frontend (.env)

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000

# Feature Flags (post-MVP)
VITE_ENABLE_PROJECTS=false
VITE_ENABLE_FILE_MERGING=false
```

## Post-MVP Roadmap

### Projects Feature (Phase 7 - 4 weeks)

After the 6-week MVP, the next major feature is **multi-file workspaces**:

**Capabilities**:
- Upload multiple files into a "Project"
- Compare files side-by-side (e.g., Q1 vs Q2 sales)
- Merge files using SQL-like joins (customer data + transaction data)
- Cross-file AI insights ("How did revenue change between files?")
- Persistent work sessions (save/load projects)

**Database Schema** (see `docs/PROJECTS_FEATURE_OVERVIEW.md`):
```sql
CREATE TABLE projects (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE files (
  id INTEGER PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  filename TEXT NOT NULL,
  upload_date TIMESTAMP,
  schema_json TEXT
);

CREATE TABLE file_relationships (
  id INTEGER PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  file_a_id INTEGER REFERENCES files(id),
  file_b_id INTEGER REFERENCES files(id),
  relationship_type TEXT, -- 'comparison' or 'merge'
  config_json TEXT
);
```

**Timeline**: 4 weeks after MVP completion

### Future Enhancements (Phase 8+)

- Real-time collaboration (multiple users editing same project)
- Custom chart builder (user-defined visualizations)
- Scheduled reports (email PDF exports daily/weekly)
- Data source connectors (Google Sheets, databases)
- Advanced AI queries (trend forecasting, anomaly detection)

## Success Criteria

### Phase 1 (Week 1)
- [ ] Upload CSV file in < 2 seconds
- [ ] Display data preview with correct column types
- [ ] Handle errors gracefully (invalid file, size limit)
- [ ] Responsive design works on mobile

### Phase 3 (Week 3)
- [ ] AI insights are coherent and relevant (90%+ accuracy)
- [ ] Insights load in < 8 seconds total
- [ ] Charts display without insights if AI fails

### Phase 6 (Week 6)
- [ ] Complete end-to-end flow (upload → export) in < 15 seconds
- [ ] All API endpoints have 80%+ test coverage
- [ ] Application passes WCAG 2.1 AA accessibility audit
- [ ] Zero console errors in production build

---

**Last Updated**: 2025-01-10 (Initial creation from documentation analysis)
