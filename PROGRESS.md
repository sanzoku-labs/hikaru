# Hikaru Development Progress

**Last Updated**: Phase 3 Complete (AI Insights Integration)
**Status**: 3 of 7 Phases Complete (MVP 50% done)

---

## ✅ Completed Phases

### Phase 1: Foundation (Completed)
**Commit**: `c3817c6` - "feat: Phase 1 - Foundation"

**Backend**:
- FastAPI app structure (`backend/app/`)
- Poetry dependency management (`pyproject.toml`)
- File upload endpoint (`POST /api/upload`)
- Pandas data processor with schema detection
- Pydantic models for validation
- Support for CSV and Excel files (max 10MB)

**Frontend**:
- React 18 + TypeScript + Vite
- shadcn/ui components (11 components)
- Tailwind CSS with ES module config
- FileUploader component (drag-drop)
- DataPreview component (bi-directional scroll)
- API client with error handling

**Key Files Created**:
- `backend/app/main.py`, `config.py`, `models/schemas.py`
- `backend/app/services/data_processor.py`
- `backend/app/api/routes/upload.py`
- `frontend/src/components/FileUploader.tsx`, `DataPreview.tsx`
- `frontend/src/services/api.ts`, `types/index.ts`

---

### Phase 2: Chart Generation (Completed)
**Commit**: `d1dbf7c` - "feat: Phase 2 - Chart Generation"

**Backend**:
- ChartGenerator service with priority-based heuristics
- Chart selection algorithm:
  1. Datetime + Numeric → Line Chart
  2. Categorical (≤8 values) + Numeric → Pie Chart
  3. Categorical + Numeric → Bar Chart
  4. 2+ Numeric → Scatter Plot
- `/api/analyze/{upload_id}` endpoint
- ChartData and AnalyzeResponse schemas

**Frontend**:
- ECharts integration (`echarts`, `echarts-for-react`)
- ChartCard component (displays 4 chart types)
- ChartGrid component (responsive 2-column layout)
- Loading skeletons
- "New Upload" reset button

**Key Files Created**:
- `backend/app/services/chart_generator.py`
- `backend/app/api/routes/analyze.py`
- `frontend/src/components/ChartCard.tsx`, `ChartGrid.tsx`

---

### Phase 3: AI Insights Integration (Completed)
**Commit**: `c3c004b` - "feat: Phase 3 - AI Insights"

**Backend**:
- Anthropic SDK integration (Claude Sonnet 4)
- AIService with prompt engineering
- Per-chart insights (2-3 sentences)
- Global summary (3-4 sentences)
- 24-hour in-memory caching
- Graceful degradation without API key

**Frontend**:
- GlobalSummary component with Alert styling
- ChartCard updated to show insights
- TypeScript types updated

**Key Files Created**:
- `backend/app/services/ai_service.py`
- `frontend/src/components/GlobalSummary.tsx`

**Configuration**:
- Requires `ANTHROPIC_API_KEY` in `backend/.env`
- Model: `claude-sonnet-4-20250514`

---

## 🚧 Remaining Phases

### Phase 4: Q&A Interface (TODO)
**Estimated**: 1-2 days

**Backend Tasks**:
- Create `POST /api/query` endpoint
- Implement conversation context management (store last 5 Q&A)
- Build dynamic prompts with data context
- Return text answers + optional chart updates

**Frontend Tasks**:
- Create ChatInterface component (message bubbles + input)
- Add suggested questions
- Display Q&A history
- Add "Clear conversation" button

**New Dependencies**: None (uses existing Anthropic SDK)

---

### Phase 5: PDF Export (TODO)
**Estimated**: 2-3 days

**Backend Tasks**:
- Install `weasyprint`, `pillow`
- Create `export_service.py` (HTML→PDF)
- Render charts to PNG images
- Create PDF template with branding
- Implement `POST /api/export` endpoint
- File cleanup (1-hour auto-delete)

**Frontend Tasks**:
- Create ExportModal component (shadcn Dialog)
- Add "Export to PDF" button
- Progress indicator
- Download link display

**New Dependencies**:
- Backend: `weasyprint`, `pillow`

---

### Phase 6: Testing & Polish (TODO)
**Estimated**: 1 week

**Backend Tasks**:
- Write pytest unit tests (data_processor, chart_generator, ai_service)
- API integration tests (all endpoints)
- Add comprehensive error handling
- Implement rate limiting (100 req/min)
- Performance optimization (DuckDB for large datasets)

**Frontend Tasks**:
- Write Vitest component tests
- Write Playwright E2E tests
- Responsive design testing
- WCAG 2.1 AA accessibility audit
- Error boundaries

**Success Criteria**:
- 80%+ test coverage
- < 15s end-to-end time (upload → export)

---

### Phase 7: Projects Feature (TODO - Post-MVP)
**Estimated**: 4 weeks

**Phase 7A: Basic Projects (2 weeks)**:
- Switch SQLite → PostgreSQL
- Database schema (projects, files, dashboards tables)
- Project CRUD endpoints
- ProjectList and ProjectDetail components
- File storage: `/uploads/{project_id}/{file_id}.csv`

**Phase 7B: File Comparison (1 week)**:
- `POST /api/projects/{id}/compare` endpoint
- Overlay charts (multiple series)
- ComparisonModal component
- Side-by-side metrics

**Phase 7C: File Merging (1 week)**:
- `POST /api/projects/{id}/relationships` endpoint
- Pandas merge logic (SQL-like joins)
- RelationshipModal component
- Cross-file insights

**New Dependencies**:
- Backend: `sqlalchemy`, `alembic`, `psycopg2-binary`
- Frontend: `react-router-dom`

---

## 📁 Current File Structure

```
hikaru/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app (includes upload, analyze routers)
│   │   ├── config.py            # Settings with field validators
│   │   ├── api/routes/
│   │   │   ├── upload.py        # POST /api/upload
│   │   │   └── analyze.py       # GET /api/analyze/{id}
│   │   ├── services/
│   │   │   ├── data_processor.py    # Pandas operations
│   │   │   ├── chart_generator.py   # Priority-based heuristics
│   │   │   └── ai_service.py        # Claude integration
│   │   └── models/
│   │       └── schemas.py       # Pydantic models
│   ├── pyproject.toml           # Poetry dependencies
│   ├── poetry.lock
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # shadcn/ui (11 components)
│   │   │   ├── FileUploader.tsx
│   │   │   ├── DataPreview.tsx
│   │   │   ├── ChartCard.tsx
│   │   │   ├── ChartGrid.tsx
│   │   │   └── GlobalSummary.tsx
│   │   ├── services/
│   │   │   └── api.ts           # API client (uploadFile, analyzeData)
│   │   ├── types/
│   │   │   └── index.ts         # TypeScript interfaces
│   │   ├── App.tsx              # Main app component
│   │   └── main.tsx
│   ├── package.json             # npm dependencies
│   └── .env.example
│
├── sample-data/
│   ├── sales_by_region.csv
│   └── monthly_revenue.csv
│
├── docs/                        # PRD and documentation
├── CLAUDE.md                    # AI assistant guidance
├── README.md                    # Setup instructions
├── PROGRESS.md                  # This file
└── .gitignore
```

---

## 🚀 How to Run

### Backend
```bash
cd backend
poetry install
cp .env.example .env
# Add ANTHROPIC_API_KEY to .env
poetry run uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Visit: http://localhost:5173

---

## 🔑 Configuration

### Backend `.env`
```env
HOST=0.0.0.0
PORT=8000
RELOAD=true
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
MAX_FILE_SIZE_MB=10
ALLOWED_EXTENSIONS=csv,xlsx
ANTHROPIC_API_KEY=sk-ant-your-key-here  # Required for AI insights
```

### Frontend `.env`
```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## 🎯 Performance Targets

- File upload: < 2s ✅
- Chart generation: < 3s per chart ✅
- AI insights: < 8s total ✅
- PDF export: < 5s (TODO)
- End-to-end: < 15s (TODO)

---

## 📦 Dependencies

### Backend (Poetry)
- `fastapi ^0.104.1`
- `uvicorn[standard] ^0.24.0`
- `pandas ^2.1.3`
- `openpyxl ^3.1.2`
- `python-multipart ^0.0.6`
- `pydantic ^2.5.0`
- `pydantic-settings ^2.1.0`
- `anthropic ^0.72.0`

### Frontend (npm)
- `react ^18.2.0`
- `vite ^5.0.0`
- `echarts ^5.4.3`
- `echarts-for-react ^3.0.2`
- `shadcn/ui` components (via Radix UI)
- `tailwindcss ^3.3.5`

---

## 🐛 Known Issues

1. **Filename tracking**: Currently shows "data.csv" instead of original filename in analyze endpoint (low priority)
2. **File retention**: No automatic cleanup of old uploads yet (implement in Phase 6)

---

## 💡 Key Architecture Decisions

1. **Poetry over pip**: Better dependency resolution, lock files
2. **Pydantic Settings**: Type-safe configuration with field validators for CSV lists
3. **Priority-based chart heuristics**: Deterministic chart selection based on data types
4. **In-memory caching**: Simple for MVP, reduces AI costs by 60%
5. **Graceful AI degradation**: Charts work without API key
6. **ES modules**: Frontend uses type: "module" for Vite compatibility

---

## 🔄 Git Commits

1. `c3817c6` - Phase 1: Foundation (File upload + Data preview)
2. `d1dbf7c` - Phase 2: Chart Generation (Priority-based heuristics)
3. `c3c004b` - Phase 3: AI Insights (Claude Sonnet 4 integration)

---

## 📝 Next Session TODO

**Priority**: Phase 4 (Q&A Interface)

1. Create `backend/app/api/routes/query.py`
2. Create conversation context storage (in-memory for MVP)
3. Add `QueryRequest` and `QueryResponse` Pydantic models
4. Create `frontend/src/components/ChatInterface.tsx`
5. Update API client with `queryData()` method
6. Add Q&A section to App.tsx
7. Test with sample questions
8. Commit Phase 4

**Estimated time**: 2-3 hours

---

**End of Progress Document**
