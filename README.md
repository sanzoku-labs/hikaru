# Hikaru - AI Data Insight Board

**Status**: 🚀 **Production Ready**  
**Version**: 1.0.0  
**Last Updated**: November 15, 2025

Transform CSV and Excel data into interactive BI dashboards with AI-generated insights powered by Claude Sonnet 4.

---

## ✨ What is Hikaru?

Hikaru is an intelligent data analytics platform that transforms raw data files into professional BI dashboards automatically. Upload a CSV or Excel file, and get:

- **Automatic Chart Generation**: AI selects the best visualizations for your data
- **AI-Powered Insights**: Per-chart analysis and global summaries using Claude Sonnet 4
- **Interactive Q&A**: Ask questions about your data in natural language
- **Multi-File Projects**: Organize, compare, and merge related datasets
- **Professional Reports**: Export to PDF with charts and insights

**Think of it as**: A simplified, intelligent alternative to Power BI or Tableau, designed for non-technical users.

---

## 🎯 Quick Start

### Prerequisites
- Python 3.11+ (developed on 3.13)
- Node.js 18+
- Anthropic API key ([get one here](https://console.anthropic.com/))

### 1. Backend Setup

```bash
cd backend
poetry install

# Create .env file
cat > .env << EOF
ANTHROPIC_API_KEY=sk-ant-your-api-key-here
SECRET_KEY=your-secret-key-change-in-production
DATABASE_URL=sqlite:///./hikaru.db
CORS_ORIGINS=http://localhost:5173
EOF

# Run database migrations
poetry run alembic upgrade head

# Start server
poetry run uvicorn app.main:app --reload --port 8000
```

Backend available at: **http://localhost:8000**

### 2. Frontend Setup

```bash
cd frontend
npm install

# Create .env file
echo "VITE_API_BASE_URL=http://localhost:8000" > .env

# Start dev server
npm run dev
```

Frontend available at: **http://localhost:5173**

### 3. Create Your First Analysis

1. Visit http://localhost:5173
2. Register an account (or use test account: `admin@hikaru.ai` / `Admin123`)
3. Navigate to "Quick Analysis"
4. Upload a CSV or Excel file
5. Watch as Hikaru automatically generates charts and insights!

**That's it!** 🎉

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | FastAPI, Python 3.13, Poetry |
| **Database** | SQLite (PostgreSQL-ready) |
| **Data Processing** | Pandas, DuckDB |
| **AI** | Anthropic Claude Sonnet 4 |
| **Authentication** | JWT + bcrypt |
| **PDF Generation** | ReportLab |
| **Frontend** | React 18, TypeScript, Vite |
| **UI Components** | shadcn/ui (35 components) |
| **Styling** | Tailwind CSS |
| **Charts** | ECharts v5 |
| **Routing** | React Router v6 |

---

## 🎯 Key Features

### ✅ Core Analytics (Phase 1-5)
- **File Upload**: Drag-and-drop CSV/Excel with automatic schema detection
- **Data Preview**: Interactive table with column type inference (numeric, categorical, datetime)
- **Chart Generation**: AI-powered automatic chart selection using priority-based heuristics
  - Line charts for time series
  - Pie charts for categorical breakdowns
  - Bar charts for comparisons
  - Scatter plots for correlations
- **AI Insights**: Per-chart analysis (2-3 sentences) + global summary (3-4 sentences)
- **Q&A Chat**: Natural language queries ("What are the top products?", "Show me revenue trends")
- **PDF Export**: Professional report generation with charts and insights

### ✅ Advanced Features (Phase 7-9)
- **User Authentication**: Secure JWT-based authentication with session management
- **Multi-File Projects**: Organize related datasets into workspaces
- **File Comparison**: Side-by-side comparison with visual diff highlighting
- **File Merging**: SQL-like joins (inner, left, right, outer) with visual key mapping
- **High-Fidelity UI**: Professional interface with responsive design and dark mode

### 📊 Chart Generation Intelligence

Hikaru uses **priority-based heuristics** to automatically select the best charts:

| Priority | Data Pattern | Chart Type | Example |
|----------|--------------|------------|---------|
| 1 | Datetime + Numeric | Line Chart | Monthly revenue trend |
| 2 | Categorical (≤8 values) + Numeric | Pie Chart | Market share by segment |
| 3 | Categorical + Numeric | Bar Chart | Sales by region |
| 4 | 2+ Numeric columns | Scatter Plot | Price vs quantity correlation |

The system analyzes your data schema and generates 2-4 optimal charts automatically.

---

## 📂 Project Structure

```
hikaru/
├── backend/                    # FastAPI application
│   ├── app/
│   │   ├── main.py            # Entry point
│   │   ├── api/routes/        # 25+ API endpoints
│   │   ├── services/          # Business logic layer
│   │   ├── models/            # Database models + Pydantic schemas
│   │   └── storage.py         # File storage utilities
│   ├── alembic/               # Database migrations
│   ├── tests/                 # 253 tests (55% coverage)
│   └── pyproject.toml         # Poetry dependencies
│
├── frontend/                   # React application
│   ├── src/
│   │   ├── main.tsx           # Entry point
│   │   ├── pages/             # 10+ page components
│   │   ├── components/        # 45+ reusable components
│   │   ├── services/          # API client
│   │   └── types/             # TypeScript types
│   └── package.json           # npm dependencies
│
├── PROGRESS.md                 # Current project status
└── CLAUDE.md                   # Development guidelines
```

---

## 🚀 Development

### Run Tests
```bash
# Backend
cd backend
poetry run pytest                    # Run all tests
poetry run pytest --cov=app          # With coverage report

# Frontend (when implemented)
cd frontend
npm run test
```

### Code Quality
```bash
cd backend
poetry run black app/        # Format code
poetry run ruff check app/   # Lint
poetry run mypy app/         # Type check
```

### Build for Production
```bash
# Frontend
cd frontend
npm run build     # Creates dist/
npm run preview   # Preview build

# Backend (Python is interpreted, no build step needed)
cd backend
poetry run pytest  # Ensure tests pass
```

---

## 📊 Performance Metrics

All performance targets have been met:

- ✅ File upload processing: < 2s
- ✅ Chart generation: < 3s per chart
- ✅ AI insights (all charts + summary): < 8s total
- ✅ PDF export: < 5s
- ✅ **Total end-to-end flow**: < 15s

**Production Build:**
- Bundle size: 1.66 MB (521 KB gzipped)
- Build time: 3.17s
- Zero TypeScript errors
- Zero console errors

---

## 🎯 Project Status

| Phase | Features | Status |
|-------|----------|--------|
| **Phase 1-5** | MVP (Upload, Charts, AI, Q&A, Export) | ✅ Complete |
| **Phase 7** | Multi-File Projects | ✅ Complete |
| **Phase 8** | User Authentication | ✅ Complete |
| **Phase 9** | UI Redesign | ✅ Complete |
| **Week 3-4** | Backend Refactoring | ✅ Complete |
| **Phase 5** | Testing (253 tests, 55% coverage) | ✅ Complete |
| **Phase 10** | Additional Testing | ⏳ Pending |
| **Phase 11** | Deployment | ⏳ Pending |

**Current Focus**: Polishing and preparing for deployment

See [`PROGRESS.md`](PROGRESS.md) for detailed status.

---

## 🎓 How to Use

### Single File Analysis (Quick Analysis)

1. **Upload File**
   - Navigate to "Quick Analysis" (`/quick-analysis`)
   - Drag-and-drop CSV/Excel or click to browse
   - Optionally enter analysis intent (e.g., "Show revenue trends")
   - Click "Analyze"

2. **View Results**
   - Data preview table (first 10 rows with column types)
   - 2-4 automatically generated charts
   - AI insights below each chart
   - Global summary with key findings

3. **Ask Questions**
   - Scroll to Q&A Chat section
   - Type questions in natural language
   - Get AI-powered answers based on your data

4. **Export Report**
   - Click "Export" button
   - Choose format (PDF)
   - Download professional report with all charts and insights

### Multi-File Projects

1. **Create Project**
   - Navigate to "Projects" (`/projects`)
   - Click "New Project"
   - Enter project name and description

2. **Upload Files**
   - Open project
   - Click "Upload File" or drag-drop multiple files
   - Each file is automatically analyzed

3. **Compare Files**
   - Click "Compare" tab
   - Select File A and File B from dropdowns
   - View side-by-side comparison with diff highlighting
   - See visual statistics (rows added/removed/modified)

4. **Merge Files**
   - Click "Merge" tab
   - Select files to merge
   - Choose join type (Inner/Left/Right/Outer)
   - Map join keys (e.g., `customer_id` ↔ `id`)
   - Configure advanced options
   - Click "Execute Merge"
   - Download merged result

### Authentication

**Test Account**:
- Email: `admin@hikaru.ai`
- Password: `Admin123`

**Create New Account**:
1. Click "Register" or navigate to `/register`
2. Fill in email, username, password
3. Password requirements:
   - At least 8 characters
   - One uppercase, one lowercase, one digit
4. Click "Sign Up"

**Login**:
- Use email or username + password
- JWT token valid for 7 days
- Click logout icon (⎋) to sign out

---

## 📖 API Documentation

Visit **http://localhost:8000/docs** for interactive API documentation (Swagger UI).

### Key Endpoints

**Authentication**:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - Logout (revoke token)

**File Analysis**:
- `POST /api/upload` - Upload and analyze file
- `POST /api/analyze/{upload_id}` - Generate charts
- `POST /api/query` - Q&A chat
- `POST /api/export` - Generate PDF report

**Projects**:
- `POST /api/projects` - Create project
- `GET /api/projects` - List user's projects
- `POST /api/projects/{id}/files` - Upload file to project
- `POST /api/projects/{id}/compare` - Compare two files
- `POST /api/projects/{id}/merge-analyze` - Merge files

All endpoints (except auth) require JWT token in `Authorization: Bearer <token>` header.

---

## 🔐 Security

- **Authentication**: JWT tokens with 7-day expiration
- **Password Hashing**: bcrypt with salt (irreversible)
- **Session Management**: Server-side token revocation
- **User Isolation**: All data scoped to authenticated user
- **CORS Protection**: Configured origin whitelist
- **Rate Limiting**: 100 requests/minute per IP
- **Input Validation**: Pydantic models on all endpoints
- **File Validation**: Size limits (30MB), extension whitelist, content validation
- **CSV Injection Protection**: Sanitizes cells starting with `=`, `+`, `-`, `@`

---

## 🧪 Testing

**Backend**:
- Total Tests: 253
- Pass Rate: 100%
- Coverage: 55%

**Test Suites**:
- Unit tests for services (chart generation, data processing, AI)
- Integration tests for API endpoints
- Database model tests

```bash
cd backend
poetry run pytest                 # Run all tests
poetry run pytest --cov=app       # With coverage
poetry run pytest -v              # Verbose output
poetry run pytest tests/unit/     # Specific suite
```

**Frontend**: Tests to be implemented in Phase 10

---

## 🛠️ Troubleshooting

### Backend Issues

**"Module not found" error**:
```bash
cd backend
poetry install  # Reinstall dependencies
```

**"ANTHROPIC_API_KEY not found"**:
- Charts still work, but AI insights disabled
- Add API key to `backend/.env`
- Get key from https://console.anthropic.com/

**Port 8000 already in use**:
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9  # macOS/Linux
# Or change PORT in backend/.env
```

**Database locked error**:
```bash
cd backend
rm hikaru.db
poetry run alembic upgrade head
```

### Frontend Issues

**"Cannot connect to backend"**:
- Verify backend running: http://localhost:8000/docs
- Check `VITE_API_BASE_URL` in `frontend/.env`
- Check `CORS_ORIGINS` in `backend/.env`

**Build errors**:
```bash
cd frontend
rm -rf node_modules dist
npm install
npm run build
```

**Hot reload not working**:
- Save file again
- Restart dev server: Ctrl+C, then `npm run dev`
- Clear browser cache

### Fresh Install

```bash
# Backend
cd backend
rm -rf .venv __pycache__ hikaru.db storage/
poetry install
poetry run alembic upgrade head

# Frontend
cd frontend
rm -rf node_modules dist
npm install
```

---

## 🤝 Contributing

### Setup for Development
1. Follow quick start guide above
2. Read development guidelines in [`CLAUDE.md`](CLAUDE.md)
3. Check current status in [`PROGRESS.md`](PROGRESS.md)

### Code Standards
- **Backend**: Python 3.11+, Poetry, FastAPI conventions, Black formatting
- **Frontend**: TypeScript strict mode, React 18, functional components, Prettier
- **Testing**: Pytest (backend), Vitest (frontend - coming soon)
- **Commits**: Conventional commits format

### Development Workflow
1. Create feature branch from `main`
2. Make changes with tests
3. Run `poetry run pytest` (backend) and `npm run build` (frontend)
4. Ensure all tests pass and build succeeds
5. Submit pull request

---

## 📞 Support & Resources

**Documentation**:
- **Current Status**: [`PROGRESS.md`](PROGRESS.md) - What's done, what's next
- **Development Guide**: [`CLAUDE.md`](CLAUDE.md) - How to work with the codebase
- **Historical Docs**: `docs/archive/` - Planning documents and phase reports

**Getting Help**:
- Check troubleshooting section above
- Review API docs at http://localhost:8000/docs
- Consult archived documentation for implementation details

---

## 📄 License

Proprietary - Sanzoku Labs

---

## 🎉 Acknowledgments

Built with:
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [React](https://react.dev/) - UI library
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Anthropic Claude](https://www.anthropic.com/) - AI insights engine
- [ECharts](https://echarts.apache.org/) - Powerful data visualization
- [Poetry](https://python-poetry.org/) - Python dependency management
- [Vite](https://vitejs.dev/) - Lightning-fast frontend tooling

---

**Ready to transform your data into insights?** 🚀

Start with the Quick Start guide above or jump to [`PROGRESS.md`](PROGRESS.md) to see what's been built!
