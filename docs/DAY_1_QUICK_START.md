# Hikaru - Day 1 Quick Start Checklist

**Goal:** Working file upload + data preview in 4 hours

---

## ⏱️ Time Budget

- Setup (30 min)
- Claude Code scaffold (60 min)
- Testing & fixes (90 min)
- Polish (60 min)

**Total: 4 hours** ⏰

---

## ✅ Pre-Flight Checklist (5 minutes)

- [ ] Python 3.11+ installed (`python3 --version`)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] Git installed (`git --version`)
- [ ] Code editor ready (VS Code recommended)
- [ ] Claude Code access confirmed
- [ ] Terminal ready (2 tabs: backend + frontend)

---

## 📁 Step 1: Create Project Structure (10 minutes)

### 1.1 Create Repository
```bash
mkdir hikaru
cd hikaru
git init

# Create docs folder and copy all 4 docs
mkdir docs
# Copy: DSB_PRD_v1.1.md, CLAUDE_CODE_PROMPT.md, 
#       PROJECTS_FEATURE_OVERVIEW.md, HOW_TO_USE_THESE_DOCS.md
```

### 1.2 Create Sample Data
```bash
mkdir sample-data
cd sample-data
```

Create `sales_by_region.csv`:
```csv
region,revenue,units_sold,quarter
North,125000,450,Q1
South,98000,380,Q1
East,145000,520,Q1
West,112000,430,Q1
North,135000,480,Q2
South,105000,395,Q2
East,155000,545,Q2
West,118000,445,Q2
```

Create `monthly_revenue.csv`:
```csv
month,revenue,expenses,profit
2024-01-01,50000,35000,15000
2024-02-01,55000,37000,18000
2024-03-01,52000,36000,16000
2024-04-01,58000,39000,19000
2024-05-01,61000,40000,21000
2024-06-01,59000,38000,21000
```

### 1.3 Create .gitignore
```bash
cd ..
nano .gitignore
```

Content:
```
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/
.env

# Node
node_modules/
dist/
build/
.DS_Store

# Uploads
uploads/
*.csv
*.xlsx

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
```

---

## 🤖 Step 2: Claude Code Scaffolding (60 minutes)

### 2.1 Open Claude Code
```bash
# Open Claude Code in your terminal
code .  # if using VS Code, or your preferred editor
```

### 2.2 Copy Entire Prompt
Open `docs/CLAUDE_CODE_PROMPT.md` and copy **everything**.

### 2.3 Paste into Claude Code
Start a new Claude Code session and paste the entire prompt.

### 2.4 Let It Generate
Claude Code will create:
- ✅ Backend structure (FastAPI)
- ✅ Frontend structure (React + Vite + shadcn/ui)
- ✅ All necessary files
- ✅ Requirements and dependencies

**Expected time:** 15-30 minutes (Claude Code works in the background)

### 2.5 Review Generated Files
```bash
tree -L 3 -I 'node_modules|__pycache__|venv'
```

Expected structure:
```
hikaru/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── api/
│   │   ├── services/
│   │   └── models/
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── types/
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── sample-data/
├── docs/
└── .gitignore
```

---

## 🔧 Step 3: Backend Setup (15 minutes)

### 3.1 Create Python Virtual Environment
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3.2 Install Dependencies
```bash
pip install -r requirements.txt
```

Expected packages:
- fastapi
- uvicorn
- pandas
- openpyxl
- python-multipart
- python-dotenv
- pydantic

### 3.3 Create .env File
```bash
cp .env.example .env
nano .env
```

Update if needed:
```env
HOST=0.0.0.0
PORT=8000
RELOAD=true
CORS_ORIGINS=http://localhost:5173
MAX_FILE_SIZE_MB=10
ALLOWED_EXTENSIONS=csv,xlsx
ANTHROPIC_API_KEY=  # Leave empty for Phase 1
```

### 3.4 Test Backend
```bash
uvicorn app.main:app --reload --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

### 3.5 Test Health Endpoint
Open browser or use curl:
```bash
curl http://localhost:8000/health
```

**Expected response:**
```json
{"status": "healthy", "version": "1.0.0"}
```

✅ **Backend working!**

---

## 🎨 Step 4: Frontend Setup (15 minutes)

### 4.1 Open New Terminal Tab
Keep backend running, open new terminal:
```bash
cd frontend
```

### 4.2 Install Dependencies
```bash
npm install
```

Expected packages:
- react
- react-dom
- vite
- tailwindcss
- lucide-react
- @radix-ui/* (shadcn/ui dependencies)

### 4.3 Verify shadcn/ui Setup
```bash
ls src/components/ui/
```

Should see:
- button.tsx
- card.tsx
- input.tsx
- table.tsx
- etc.

### 4.4 Start Dev Server
```bash
npm run dev
```

**Expected output:**
```
VITE v5.x.x  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 4.5 Open Browser
Navigate to `http://localhost:5173`

**Expected screen:**
- ✅ "Hikaru" header
- ✅ "Upload Your Data" section
- ✅ Drag-drop zone
- ✅ No console errors

✅ **Frontend working!**

---

## 🧪 Step 5: End-to-End Test (20 minutes)

### 5.1 Test File Upload UI

**In browser:**
1. Click on drag-drop zone
2. Select `sample-data/sales_by_region.csv`
3. File preview should appear with filename and size
4. Click "Analyze Data"

**Expected behavior:**
- Progress bar appears
- Upload completes in < 2 seconds
- Data preview table appears
- Column headers show type badges (categorical, numeric)
- First 10 rows visible
- Row/column count displayed

### 5.2 Test Backend API Directly
```bash
curl -X POST http://localhost:8000/api/upload \
  -F "file=@sample-data/sales_by_region.csv"
```

**Expected response:** JSON with:
- `upload_id`
- `filename`
- `schema` object with columns
- `upload_timestamp`

### 5.3 Test Error Handling

**Test 1: Too large file**
Create a dummy large file:
```bash
dd if=/dev/zero of=/tmp/large.csv bs=1M count=15
```

Upload it → Should get error: "File too large"

**Test 2: Invalid file type**
```bash
echo "test" > /tmp/test.txt
```

Upload it → Should get error: "Unsupported file type"

**Test 3: Empty file**
```bash
touch /tmp/empty.csv
```

Upload it → Should get error: "Insufficient data"

---

## ✅ Success Criteria Checklist

After 4 hours, you should have:

### Backend ✅
- [x] FastAPI server running on port 8000
- [x] `/health` endpoint responds
- [x] `/api/upload` accepts CSV files
- [x] File validation works (size, type)
- [x] Schema detection identifies column types
- [x] Data preview returns first 10 rows
- [x] Proper error messages for invalid files

### Frontend ✅
- [x] React app running on port 5173
- [x] shadcn/ui components render correctly
- [x] File drag-drop works
- [x] File upload shows progress
- [x] Data preview table displays
- [x] Column type badges show correctly
- [x] Error states display properly
- [x] Responsive on desktop (test resize)

### Integration ✅
- [x] Full upload flow works end-to-end
- [x] CORS configured correctly
- [x] API responses typed correctly (TypeScript)
- [x] No console errors in browser
- [x] No Python errors in backend logs

---

## 🎯 If Everything Works

**Congratulations! You're done with Phase 1 foundation! 🎉**

### Commit Your Work
```bash
git add .
git commit -m "feat: Phase 1 - file upload and data preview

- FastAPI backend with upload endpoint
- React frontend with shadcn/ui
- File validation and schema detection
- Data preview with column type badges
- Sample data files for testing"

git push origin main
```

### What's Next?
You've completed **Phase 1** of the MVP.

Next steps (Week 2+):
- **Phase 2:** Chart generation (PRD Section 5)
- **Phase 3:** AI insights (PRD Section 6)
- **Phase 4:** Q&A interface
- **Phase 5:** PDF export
- **Phase 6:** Polish

Reference: PRD Section 13 (Development Roadmap)

---

## 🐛 If Something Doesn't Work

### Backend Issues

**Problem: "Module not found"**
```bash
# Make sure you're in venv
which python  # Should show path with 'venv'
pip list  # Verify packages installed
pip install -r requirements.txt --force-reinstall
```

**Problem: "Port 8000 already in use"**
```bash
# Find and kill process
lsof -i :8000  # Mac/Linux
# Or change port in .env: PORT=8001
```

**Problem: "CORS error in browser"**
Check `backend/app/config.py`:
```python
cors_origins: List[str] = ["http://localhost:5173"]
```

### Frontend Issues

**Problem: "shadcn/ui components not found"**
```bash
# Verify components exist
ls src/components/ui/

# If missing, add them
npx shadcn-ui@latest add button card input table
```

**Problem: "npm install fails"**
```bash
# Clear cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Problem: "API calls fail"**
Check `frontend/src/services/api.ts`:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
```

Create `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:8000
```

### Still Stuck?

1. Check backend logs in terminal
2. Check browser console (F12)
3. Search PRD Section 9 (Error Handling)
4. Ask Claude Code with specific error message
5. Review CLAUDE_CODE_PROMPT.md for examples

---

## 📊 Time Tracking

Track your actual time:

| Task | Estimated | Actual |
|------|-----------|--------|
| Setup project structure | 10 min | ___ min |
| Claude Code generation | 30 min | ___ min |
| Backend setup | 15 min | ___ min |
| Frontend setup | 15 min | ___ min |
| Testing | 20 min | ___ min |
| Debugging | 60 min | ___ min |
| **Total** | **150 min** | **___ min** |

---

## 🎓 What You Learned Today

After completing Day 1, you now have:
- ✅ FastAPI backend with async patterns
- ✅ Pydantic validation and schema generation
- ✅ React + TypeScript + Vite setup
- ✅ shadcn/ui component library integrated
- ✅ File upload with validation
- ✅ Data parsing with pandas
- ✅ Full-stack communication (REST API)
- ✅ Error handling patterns
- ✅ Modern development workflow

**This foundation will make the rest of the MVP much faster!**

---

## 🚀 Day 2 Preview

Tomorrow, you'll add:
- Chart generation service (Python)
- ECharts integration (React)
- 3-4 auto-generated charts
- Chart grid layout

Estimated time: **6-8 hours**

Reference: PRD Section 5 (Chart Heuristics)

---

**Now go celebrate! You built the foundation of Hikaru in 4 hours! 🎉**
