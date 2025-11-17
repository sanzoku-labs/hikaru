# Next Steps - Quick Reference

**Last Session**: 2025-11-14  
**Current Status**: Phase 1 Complete ✅, Phase 2.1 Complete ✅  
**Next Task**: Phase 2.2 - Create ProjectService (TDD)

---

## 🎯 Immediate Next Steps (In Order)

### 1. Create ProjectService (TDD) - 6-8 hours

**File to Create**: `backend/app/services/project_service.py`

**Test File to Create First**: `backend/tests/unit/test_services/test_project_service.py`

**Template**:
```python
# tests/unit/test_services/test_project_service.py
import pytest
from sqlalchemy.orm import Session
from app.services.project_service import ProjectService
from app.core.exceptions import ProjectNotFoundError
from app.models.database import Project, User


class TestProjectServiceCreate:
    def test_create_project_success(self, db_session: Session, test_user: User):
        service = ProjectService(db_session)
        project = service.create_project(
            user_id=test_user.id,
            name="Test Project",
            description="Test description"
        )
        
        assert project.name == "Test Project"
        assert project.user_id == test_user.id
        assert project.is_archived is False


class TestProjectServiceGet:
    def test_get_project_owned_by_user(self, db_session: Session, test_user: User):
        # Test implementation
        pass
    
    def test_get_project_not_owned_raises_exception(self, db_session: Session):
        # Test implementation
        pass

# ... more test classes
```

**Implementation**:
```python
# app/services/project_service.py
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.database import Project
from app.core.exceptions import ProjectNotFoundError, ValidationError


class ProjectService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_project(
        self, 
        user_id: int, 
        name: str, 
        description: Optional[str] = None
    ) -> Project:
        """Create a new project for user."""
        if not name or len(name.strip()) == 0:
            raise ValidationError("Project name cannot be empty")
        
        project = Project(
            user_id=user_id,
            name=name.strip(),
            description=description,
            is_archived=False
        )
        self.db.add(project)
        self.db.commit()
        self.db.refresh(project)
        return project
    
    def get_project(self, project_id: int, user_id: int) -> Project:
        """Get project by ID, ensuring user owns it."""
        project = (
            self.db.query(Project)
            .filter(Project.id == project_id, Project.user_id == user_id)
            .first()
        )
        if not project:
            raise ProjectNotFoundError(f"Project {project_id} not found or access denied")
        return project
    
    # ... more methods
```

**Target**: 15-20 tests, 100% coverage on ProjectService

---

### 2. Refactor projects.py to Use ProjectService - 2-3 hours

**Route to Update**: `backend/app/api/routes/projects.py`

**Before**:
```python
@router.post("/projects", response_model=ProjectResponse)
async def create_project(
    request: ProjectCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    # 20+ lines of validation and creation logic
    project = Project(name=request.name, user_id=current_user.id, ...)
    db.add(project)
    db.commit()
    # ... more logic
```

**After**:
```python
@router.post("/projects", response_model=ProjectResponse)
async def create_project(
    request: ProjectCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    project_service = ProjectService(db)
    project = project_service.create_project(
        user_id=current_user.id,
        name=request.name,
        description=request.description
    )
    return ProjectResponse.model_validate(project)
```

**Endpoints to Refactor**:
1. ✅ `POST /api/projects` - create_project()
2. ✅ `GET /api/projects` - list_user_projects()
3. ✅ `GET /api/projects/{id}` - get_project()
4. ✅ `PUT /api/projects/{id}` - update_project()
5. ✅ `DELETE /api/projects/{id}` - delete_project()
6. ✅ `POST /api/projects/{id}/archive` - archive_project()

---

### 3. Create AnalysisService (TDD) - 4-6 hours

**File to Create**: `backend/app/services/analysis_service.py`

**Test File to Create First**: `backend/tests/unit/test_services/test_analysis_service.py`

**Key Features**:
- `analyze_file()` - Generate charts + AI insights
- `get_cached_analysis()` - Check if analysis exists
- `save_analysis()` - Persist to database

**Template**:
```python
class AnalysisService:
    def __init__(
        self, 
        db: Session, 
        upload_service: UploadService,
        cache_service: Optional[CacheService] = None,
        ai_service: Optional[AIService] = None
    ):
        self.db = db
        self.upload = upload_service
        self.cache = cache_service
        self.ai = ai_service
    
    def analyze_file(
        self, 
        upload_id: str, 
        user_intent: Optional[str] = None
    ) -> AnalyzeResponse:
        """Generate analysis for uploaded file."""
        # Get file data
        upload_data = self.upload.get_upload(upload_id)
        df = upload_data["dataframe"]
        schema = upload_data["schema"]
        
        # Generate charts
        chart_gen = ChartGenerator()
        charts = chart_gen.generate_charts(df, schema, user_intent)
        
        # Generate AI insights (if available)
        if self.ai:
            for chart in charts:
                chart.insight = self.ai.generate_chart_insight(chart, schema)
            global_summary = self.ai.generate_global_summary(charts, schema)
        else:
            global_summary = None
        
        return AnalyzeResponse(
            upload_id=upload_id,
            charts=charts,
            global_summary=global_summary
        )
```

**Target**: 10-15 tests, 100% coverage on AnalysisService

---

### 4. Quick Wins (1-2 hours each)

#### Fix Datetime Deprecations
```bash
cd backend
# Find all occurrences
grep -r "datetime.utcnow()" app/

# Replace with
from datetime import timezone
datetime.now(timezone.utc)
```

**Files to Update**:
- `app/services/upload_service.py`
- `app/models/database.py`
- All model default values

#### Fix Pydantic v2 Deprecations
```python
# Before
class UserResponse(BaseModel):
    class Config:
        from_attributes = True

# After
from pydantic import ConfigDict

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
```

**Files to Update**:
- `app/models/schemas.py` (6 classes)
- `app/config.py` (1 class)

#### Fix SQLAlchemy Deprecations
```python
# Before
from sqlalchemy.ext.declarative import declarative_base

# After
from sqlalchemy.orm import declarative_base
```

**Files to Update**:
- `app/models/database.py`

---

## 🔄 Development Workflow

### Before Starting Each Task
```bash
cd /Users/sovanaryththorng/sanzoku_labs/hikaru/backend

# 1. Pull latest changes
git pull

# 2. Create feature branch (optional)
git checkout -b feature/project-service

# 3. Verify tests pass
poetry run pytest tests/unit/ -v
```

### TDD Workflow
```bash
# 1. Write test FIRST
# Create: tests/unit/test_services/test_project_service.py

# 2. Run test (should FAIL)
poetry run pytest tests/unit/test_services/test_project_service.py -v

# 3. Implement code to make test pass
# Create: app/services/project_service.py

# 4. Run test again (should PASS)
poetry run pytest tests/unit/test_services/test_project_service.py -v

# 5. Check coverage
poetry run pytest tests/unit/ --cov=app --cov-report=term-missing
```

### After Completing Each Task
```bash
# 1. Format code
poetry run isort app/ tests/
poetry run black app/ tests/

# 2. Run all tests
poetry run pytest tests/unit/ -v

# 3. Check coverage
poetry run pytest tests/unit/ --cov=app --cov-report=html

# 4. Commit changes
git add -A
git commit -m "feat: Add ProjectService with TDD approach

- Created ProjectService with CRUD operations
- 15 tests with 100% coverage
- Uses custom exceptions for error handling
- Refactored projects.py routes to use service

Test Coverage:
- ProjectService: 100%
- Overall: XX%

Breaking Changes: None
"

# 5. Push to remote
git push origin main
```

---

## 📚 Useful Commands

### Testing
```bash
# Run all tests
poetry run pytest tests/unit/ -v

# Run specific test file
poetry run pytest tests/unit/test_services/test_project_service.py -v

# Run with coverage
poetry run pytest tests/unit/ --cov=app --cov-report=html

# Open coverage report
open htmlcov/index.html
```

### Code Quality
```bash
# Format code
poetry run isort app/ tests/
poetry run black app/ tests/

# Type checking (when ready)
poetry run mypy app/

# Linting
poetry run ruff check app/

# Security audit
poetry run bandit -r app/
```

### Development Server
```bash
# Start FastAPI server
poetry run uvicorn app.main:app --reload --port 8000

# Test endpoint
curl http://localhost:8000/health
```

---

## 📊 Coverage Tracking

### Current Status
| Module | Coverage | Target |
|--------|----------|--------|
| dependencies.py | 100% | 100% ✅ |
| cache_service.py | 100% | 100% ✅ |
| upload_service.py | 100% | 100% ✅ |
| exceptions.py | 88% | 90% |
| **Overall** | **37%** | **50%** |

### After Phase 2.2 (ProjectService)
| Module | Coverage | Target |
|--------|----------|--------|
| project_service.py | 100% | 100% ✅ |
| projects.py (routes) | 60%+ | 70% |
| **Overall** | **42%+** | **50%** |

### After Phase 2.3 (AnalysisService)
| Module | Coverage | Target |
|--------|----------|--------|
| analysis_service.py | 100% | 100% ✅ |
| analyze.py (routes) | 60%+ | 70% |
| **Overall** | **45%+** | **50%** |

---

## 🎯 Success Criteria for Each Phase

### Phase 2.2 Complete When:
- [ ] ProjectService created with all CRUD methods
- [ ] 15-20 tests written and passing
- [ ] 100% coverage on ProjectService
- [ ] All projects.py routes refactored
- [ ] No regressions (49 tests still passing)
- [ ] Code formatted with isort + black
- [ ] Committed to git

### Phase 2.3 Complete When:
- [ ] AnalysisService created
- [ ] 10-15 tests written and passing
- [ ] 100% coverage on AnalysisService
- [ ] analyze.py route refactored
- [ ] AIService integrated with CacheService in route
- [ ] No regressions
- [ ] Committed to git

---

## 🐛 Troubleshooting

### Tests Failing After Changes
```bash
# Check what changed
git diff

# Reset specific file
git checkout -- app/services/project_service.py

# Run tests with verbose output
poetry run pytest tests/unit/ -v -s --tb=short
```

### Import Errors
```bash
# Ensure you're in backend directory
pwd  # Should show .../hikaru/backend

# Reinstall dependencies
poetry install
```

### Coverage Too Low
```bash
# Check which lines are not covered
poetry run pytest tests/unit/ --cov=app --cov-report=term-missing

# Focus on uncovered lines
# Add tests for missing coverage
```

---

**Ready to continue? Start with Phase 2.2 - Create ProjectService (TDD)**

**Command to start**:
```bash
cd /Users/sovanaryththorng/sanzoku_labs/hikaru/backend
# Create test file first (TDD approach)
touch tests/unit/test_services/test_project_service.py
```
