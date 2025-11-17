# Getting Started with Hikaru

**Welcome!** This guide will help you set up and run Hikaru on your local machine.

**Time to complete**: ~15 minutes  
**Prerequisites**: Python 3.11+, Node.js 18+, Git

---

## 📋 Quick Start Checklist

- [ ] Clone the repository
- [ ] Set up backend (Poetry + .env)
- [ ] Set up frontend (npm + .env)
- [ ] Run database migrations
- [ ] Start both servers
- [ ] Create test account
- [ ] Upload sample file
- [ ] Verify everything works

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/hikaru.git
cd hikaru
```

### 2. Backend Setup

#### Install Dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install poetry
poetry install
```

#### Configure Environment

Create `.env` file in `backend/` directory:

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

# AI Integration (required for insights)
ANTHROPIC_API_KEY=sk-ant-your-api-key-here
ANTHROPIC_MODEL=claude-sonnet-4-20250514
AI_CACHE_TTL_HOURS=24

# Database
DATABASE_URL=sqlite:///./hikaru.db

# Authentication
SECRET_KEY=your-secret-key-here-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_DAYS=7

# Security
RATE_LIMIT_PER_MINUTE=100
```

**Important**: Replace `ANTHROPIC_API_KEY` with your actual API key from https://console.anthropic.com/

#### Run Database Migrations

```bash
poetry run alembic upgrade head
```

#### Start Backend Server

```bash
poetry run uvicorn app.main:app --reload --port 8000
```

**Verify**: Visit http://localhost:8000/docs to see the API documentation.

---

### 3. Frontend Setup

#### Install Dependencies

```bash
cd frontend
npm install
```

#### Configure Environment

Create `.env` file in `frontend/` directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000
```

#### Start Frontend Server

```bash
npm run dev
```

**Verify**: Visit http://localhost:5173 to see the application.

---

## 🧪 Verify Installation

### 1. Create Test Account

1. Open http://localhost:5173
2. Click "Register" (or navigate to `/register`)
3. Fill in the form:
   - **Username**: testuser
   - **Email**: test@example.com
   - **Full Name**: Test User
   - **Password**: Test123!
4. Click "Create Account"

### 2. Log In

1. Navigate to `/login`
2. Enter credentials:
   - **Email/Username**: test@example.com
   - **Password**: Test123!
3. Click "Sign In"

### 3. Upload Sample File

1. Navigate to "Quick Analysis" (or `/quick-analysis`)
2. Create a test CSV file (`test.csv`):

```csv
Month,Product,Region,Revenue,Units
2024-01,Laptop,North,15000,25
2024-01,Mouse,South,1200,300
2024-01,Keyboard,East,2400,150
2024-02,Laptop,North,18000,30
2024-02,Mouse,South,1500,375
2024-02,Keyboard,East,2800,175
```

3. Drag and drop `test.csv` or click to upload
4. (Optional) Enter intent: "Show me revenue trends"
5. Click "Analyze"

### 4. Verify Features

✅ **Data Preview**: Should display table with 6 rows  
✅ **Charts**: Should generate 2-4 charts automatically  
✅ **AI Insights**: Should display AI-generated summary (if API key configured)  
✅ **Q&A Chat**: Try asking "What are the top products?"  
✅ **PDF Export**: Click "Export" button to generate PDF

---

## 🏗️ Project Structure

```
hikaru/
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── main.py         # Application entry point
│   │   ├── api/routes/     # API endpoints (25+)
│   │   ├── services/       # Business logic
│   │   ├── models/         # Database models
│   │   └── storage.py      # File storage utilities
│   ├── alembic/            # Database migrations
│   ├── uploads/            # Uploaded files (gitignored)
│   ├── hikaru.db           # SQLite database (gitignored)
│   ├── pyproject.toml      # Poetry dependencies
│   └── .env                # Environment config (gitignored)
│
├── frontend/                # React application
│   ├── src/
│   │   ├── main.tsx        # Application entry point
│   │   ├── App.tsx         # Quick analysis page
│   │   ├── pages/          # Page components (10+)
│   │   ├── components/     # Reusable components (45+)
│   │   ├── services/       # API client
│   │   └── types/          # TypeScript types
│   ├── public/             # Static assets
│   ├── dist/               # Production build (gitignored)
│   ├── package.json        # npm dependencies
│   └── .env                # Environment config (gitignored)
│
├── docs/                    # Documentation
│   ├── README.md           # Documentation index
│   ├── GETTING_STARTED.md  # This file
│   ├── completed/          # Phase completion docs
│   ├── features/           # Feature guides
│   └── archive/            # Historical planning docs
│
├── PROGRESS.md              # Current project status
├── CLAUDE.md                # Development guidelines
└── README.md                # Project overview
```

---

## 🛠️ Development Workflow

### Running Both Servers

**Terminal 1 (Backend)**:
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
poetry run uvicorn app.main:app --reload --port 8000
```

**Terminal 2 (Frontend)**:
```bash
cd frontend
npm run dev
```

### Making Changes

1. **Backend Changes**: Auto-reload enabled (`--reload` flag)
2. **Frontend Changes**: Hot module replacement (HMR) enabled by Vite
3. **Database Changes**: Create migration with `poetry run alembic revision --autogenerate -m "description"`

### Running Tests

**Backend** (when tests are implemented):
```bash
cd backend
poetry run pytest
poetry run pytest --cov=app  # with coverage
```

**Frontend** (when tests are implemented):
```bash
cd frontend
npm run test
npm run test:coverage
```

### Building for Production

**Backend**:
```bash
cd backend
poetry run pytest  # Ensure tests pass
# No build step - Python is interpreted
```

**Frontend**:
```bash
cd frontend
npm run build     # Creates dist/ folder
npm run preview   # Preview production build
```

---

## 🎯 Common Tasks

### Create a New User Account
1. Navigate to http://localhost:5173/register
2. Fill in registration form
3. Verify account is created by logging in

### Create a Project
1. Log in to the application
2. Navigate to "Projects" (http://localhost:5173/projects)
3. Click "New Project"
4. Enter project name
5. Upload files to the project

### Compare Files
1. Open a project with 2+ files
2. Click "Compare" tab
3. Select File A and File B
4. View side-by-side comparison

### Merge Files
1. Open a project with 2+ files
2. Click "Merge" tab
3. Select files to merge
4. Choose join type (Inner/Left/Right/Outer)
5. Configure join keys
6. Click "Execute Merge"

### Ask AI Questions
1. Upload and analyze a file
2. Scroll to "Q&A Chat" section
3. Type your question (e.g., "What are the trends?")
4. Press Enter or click Send

### Export to PDF
1. After analyzing a file
2. Click "Export" button in header
3. Configure export options
4. Click "Export PDF"
5. Download will start automatically

---

## 🔧 Troubleshooting

### Backend Issues

**"Module not found" error**:
```bash
cd backend
poetry install  # Reinstall dependencies
```

**"Database locked" error**:
- Close other connections to `hikaru.db`
- Delete `hikaru.db` and run `alembic upgrade head` again

**"ANTHROPIC_API_KEY not found" warning**:
- Charts still work, but AI insights will be disabled
- Add your API key to `backend/.env` to enable insights

**Port 8000 already in use**:
```bash
# Find and kill process using port 8000
lsof -ti:8000 | xargs kill -9  # macOS/Linux
# Or change port in .env: PORT=8001
```

### Frontend Issues

**"Cannot connect to backend" error**:
- Verify backend is running on port 8000
- Check `VITE_API_BASE_URL` in `frontend/.env`
- Check CORS_ORIGINS in `backend/.env`

**Build errors**:
```bash
cd frontend
rm -rf node_modules dist
npm install
npm run build
```

**TypeScript errors**:
- Run `npm run build` to see all errors
- Check for missing type definitions
- Ensure all imports are correct

**Hot reload not working**:
- Save the file again
- Restart Vite dev server
- Clear browser cache

### Common Solutions

**Reset database**:
```bash
cd backend
rm hikaru.db
poetry run alembic upgrade head
```

**Clear uploaded files**:
```bash
cd backend
rm -rf uploads/*
```

**Fresh install**:
```bash
# Backend
cd backend
rm -rf venv __pycache__ .pytest_cache hikaru.db uploads
python -m venv venv
source venv/bin/activate
pip install poetry
poetry install

# Frontend
cd frontend
rm -rf node_modules dist
npm install
```

---

## 📚 Next Steps

### Learn the Features
- Read [`features/AUTHENTICATION.md`](./features/AUTHENTICATION.md) for auth usage
- Read [`features/PROJECTS.md`](./features/PROJECTS.md) for project management
- Check [`completed/`](./completed/) for implementation details

### Start Developing
- Review [`../CLAUDE.md`](../CLAUDE.md) for development guidelines
- Check [`../PROGRESS.md`](../PROGRESS.md) for current status
- See [`docs/README.md`](./README.md) for documentation index

### Understand the Architecture
- Read Phase completion docs in [`completed/`](./completed/)
- Review API documentation at http://localhost:8000/docs
- Explore component structure in `frontend/src/components/`

---

## 🎓 Learning Resources

### Internal Documentation
- **Quick Status**: `../PROGRESS.md`
- **Feature Guides**: `features/`
- **Implementation Details**: `completed/`
- **Development Guidelines**: `../CLAUDE.md`

### External Resources
- **FastAPI**: https://fastapi.tiangolo.com/
- **React**: https://react.dev/
- **Tailwind CSS**: https://tailwindcss.com/
- **shadcn/ui**: https://ui.shadcn.com/
- **ECharts**: https://echarts.apache.org/

---

## ✅ Setup Complete!

You should now have:
- ✅ Backend running on http://localhost:8000
- ✅ Frontend running on http://localhost:5173
- ✅ Database initialized with migrations
- ✅ Test account created
- ✅ Sample file analyzed

**Ready to develop?** Check out [`../CLAUDE.md`](../CLAUDE.md) for development guidelines.

**Questions?** See [`docs/README.md`](./README.md) for more documentation.

---

**Welcome to the Hikaru team! 🚀**
