# Backend Refactoring Roadmap

**Current Status**: Phase 1 Complete ✅ | Phase 2.1 Complete ✅  
**Test Coverage**: 37.00% | Target: 85%  
**Total Tests**: 49 passing ✅

---

## 📊 Progress Overview

| Phase | Status | Tests | Coverage | Completion |
|-------|--------|-------|----------|------------|
| Phase 1: Critical Fixes | ✅ Complete | 49 | 100% (new) | 100% |
| Phase 2.1: Cache Integration | ✅ Complete | 49 | 37% overall | 20% |
| Phase 2.2: ProjectService | 🔄 Next | - | - | 0% |
| Phase 2.3: AnalysisService | ⏳ Pending | - | - | 0% |
| Phase 2.4: Route Refactoring | ⏳ Pending | - | - | 0% |
| Phase 3: Code Quality | ⏳ Pending | - | - | 0% |
| Phase 4: Architecture | ⏳ Pending | - | - | 0% |
| Phase 5: Testing & QA | ⏳ Pending | - | - | 0% |

**Overall Progress**: ~25% Complete

---

## 🎯 Phase 2: Service Layer Pattern (Week 2)

### Phase 2.2: Create ProjectService (TDD) - NEXT

**Priority**: HIGH  
**Estimated Effort**: 6-8 hours  
**Impact**: Centralizes project management, reduces route complexity

#### Objectives
1. Create `app/services/project_service.py`
2. Implement CRUD operations with proper error handling
3. Use custom exceptions (ProjectNotFoundError, etc.)
4. Write tests FIRST (TDD approach)
5. Achieve 100% coverage on ProjectService

#### Features to Implement
```python
class ProjectService:
    def __init__(self, db: Session):
        self.db = db
    
    # Core CRUD
    def create_project(self, user_id: int, name: str, description: str) -> Project
    def get_project(self, project_id: int, user_id: int) -> Project
    def list_user_projects(self, user_id: int, include_archived: bool) -> List[Project]
    def update_project(self, project_id: int, user_id: int, **updates) -> Project
    def delete_project(self, project_id: int, user_id: int) -> None
    
    # Additional operations
    def archive_project(self, project_id: int, user_id: int) -> Project
    def unarchive_project(self, project_id: int, user_id: int) -> Project
    def get_project_stats(self, project_id: int, user_id: int) -> dict
```

#### Test Plan (15-20 tests)
- ✅ Create project with valid data
- ✅ Create project with duplicate name (should allow)
- ✅ Get project owned by user
- ✅ Get project not owned by user (should raise exception)
- ✅ List projects with filtering
- ✅ Update project (success and permission denied)
- ✅ Delete project with cascading files
- ✅ Archive/unarchive project
- ✅ Get project stats (file count, analysis count)

#### Routes to Refactor After
- `projects.py` - All endpoints
- `dashboards.py` - Project-related queries
- `compare.py` - Project file access
- `merge.py` - Project file access

**Estimated Line Reduction**: ~100 lines of duplicated code

---

### Phase 2.3: Create AnalysisService (TDD)

**Priority**: MEDIUM  
**Estimated Effort**: 4-6 hours  
**Impact**: Separates analysis logic from routes

#### Objectives
1. Create `app/services/analysis_service.py`
2. Move analysis logic from routes to service
3. Integrate with AIService (with CacheService)
4. Add database persistence for analysis results
5. Write tests FIRST (TDD approach)

#### Features to Implement
```python
class AnalysisService:
    def __init__(self, db: Session, cache: CacheService, ai: AIService):
        self.db = db
        self.cache = cache
        self.ai = ai
    
    def analyze_file(
        self, 
        upload_id: str, 
        user_intent: Optional[str] = None
    ) -> AnalyzeResponse
    
    def get_cached_analysis(self, upload_id: str) -> Optional[AnalyzeResponse]
    
    def save_analysis(
        self, 
        file_id: int, 
        charts: List[ChartData], 
        summary: str
    ) -> None
    
    def regenerate_analysis(self, file_id: int) -> AnalyzeResponse
```

#### Test Plan (10-15 tests)
- ✅ Analyze file with charts generation
- ✅ Analyze file with AI insights (mocked)
- ✅ Get cached analysis (cache hit)
- ✅ Get cached analysis (cache miss)
- ✅ Save analysis to database
- ✅ Regenerate analysis for file

**Estimated Line Reduction**: ~60 lines from routes

---

### Phase 2.4: Refactor Routes to Use Services

**Priority**: HIGH  
**Estimated Effort**: 4-6 hours  
**Impact**: Cleaner routes, better separation of concerns

#### Routes to Update

**analyze.py**:
```python
# Before (60+ lines in route)
upload_data = upload_service.get_upload(upload_id)
df = upload_data["dataframe"]
schema = upload_data["schema"]
chart_gen = ChartGenerator()
charts = chart_gen.generate_charts(df, schema)
ai_service = AIService()
for chart in charts:
    chart.insight = ai_service.generate_chart_insight(chart, schema)
# ... more logic

# After (10 lines in route)
analysis_service = AnalysisService(db, cache, ai_service)
analysis = analysis_service.analyze_file(upload_id, user_intent)
return analysis
```

**projects.py**:
```python
# Before (30+ lines per endpoint)
project = db.query(Project).filter(...).first()
if not project:
    raise HTTPException(404, "Project not found")
# ... validation logic
# ... business logic

# After (5 lines per endpoint)
project_service = ProjectService(db)
project = project_service.get_project(project_id, current_user.id)
return ProjectResponse.model_validate(project)
```

#### Endpoints to Refactor (Priority Order)
1. ✅ `POST /api/projects` - Use ProjectService.create_project()
2. ✅ `GET /api/projects/{id}` - Use get_user_project dependency OR ProjectService
3. ✅ `PUT /api/projects/{id}` - Use ProjectService.update_project()
4. ✅ `DELETE /api/projects/{id}` - Use ProjectService.delete_project()
5. ✅ `GET /api/analyze/{upload_id}` - Use AnalysisService.analyze_file()
6. ✅ All other project-related endpoints

**Estimated Impact**: 
- ~200 lines removed from routes
- 50%+ reduction in route complexity
- Better testability (mock services instead of database)

---

### Phase 2.5: Background Tasks for Long Operations

**Priority**: LOW (Post-MVP)  
**Estimated Effort**: 3-4 hours  
**Impact**: Better UX for slow operations

#### Operations to Move to Background
1. **PDF Export** (currently blocks request)
   - Return job ID immediately
   - Poll for completion
   - Download when ready

2. **Large File Analysis** (>5000 rows)
   - Generate charts in background
   - Show progress indicator
   - Notify when complete

3. **AI Insight Generation** (multiple charts)
   - Generate insights asynchronously
   - Update UI progressively

#### Implementation with FastAPI BackgroundTasks
```python
from fastapi import BackgroundTasks

@router.post("/export")
async def export_dashboard(
    request: ExportRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    export_id = str(uuid.uuid4())
    
    # Start background task
    background_tasks.add_task(
        generate_pdf_async,
        export_id=export_id,
        request=request,
        db=db
    )
    
    return {"export_id": export_id, "status": "processing"}
```

**Not Implementing Now**: Focus on core service layer first

---

## 🎯 Phase 3: Code Quality Improvements (Week 3)

### Objectives
1. **Pydantic v2 Migration** - Replace deprecated Config classes
2. **SQLAlchemy 2.0** - Replace deprecated declarative_base()
3. **Mypy Strict Mode** - Add type hints to all functions
4. **Query Optimization** - Add indexes, use eager loading
5. **Long Function Refactoring** - Break down 100+ line functions
6. **Constants File** - Centralize magic strings and numbers

### High-Priority Items

#### 3.1: Pydantic v2 Migration (2-3 hours)
**Current Issue**: 7 deprecation warnings
```python
# Before
class UserResponse(BaseModel):
    class Config:
        from_attributes = True

# After
class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
```

**Files to Update**:
- `app/models/schemas.py` (6 classes)
- `app/config.py` (1 class)

#### 3.2: SQLAlchemy 2.0 Migration (1-2 hours)
**Current Issue**: MovedIn20Warning
```python
# Before
from sqlalchemy.ext.declarative import declarative_base
Base = declarative_base()

# After
from sqlalchemy.orm import declarative_base
Base = declarative_base()
```

**Files to Update**:
- `app/models/database.py`

#### 3.3: Datetime Deprecation (1 hour)
**Current Issue**: datetime.utcnow() deprecated
```python
# Before
created_at = datetime.utcnow()

# After
from datetime import timezone
created_at = datetime.now(timezone.utc)
```

**Files to Update**:
- `app/services/upload_service.py`
- `app/models/database.py` (all default values)

#### 3.4: Add Missing Type Hints (2-3 hours)
**Goal**: Mypy strict mode compliance

**Files Needing Type Hints**:
- `app/services/ai_service.py` - 280 lines
- `app/services/chart_generator.py` - 165 lines
- `app/services/data_processor.py` - 76 lines

---

## 🎯 Phase 4: Architecture Patterns (Week 4)

### 4.1: Split Large Services
**Target**: AIService (287 lines) → Multiple focused services
- `AIInsightService` - Chart insights only
- `AIConversationService` - Q&A functionality
- `AIAnalysisService` - Data analysis suggestions

### 4.2: API Versioning
**Goal**: Prepare for breaking changes
- Create `/api/v1/` namespace
- Move all routes to v1
- Keep `/api/` as alias (backward compat)

### 4.3: Repository Pattern (Optional)
**Goal**: Abstract database access
- Create repository classes for each model
- Makes switching databases easier
- Better for testing

---

## 🎯 Phase 5: Testing & QA (Week 5)

### Objectives
- Achieve **85%+ overall coverage**
- Add **integration tests** (request/response flows)
- Add **E2E tests** (Playwright/Cypress)
- **Performance testing** (Locust)
- **Security audit** (Bandit)

### Coverage Targets by Module
| Module | Current | Target | Gap |
|--------|---------|--------|-----|
| Routes | 15-38% | 70% | +40% |
| Services | 13-100% | 85% | varies |
| Models | 94-100% | 95% | +1% |
| Core | 57-100% | 90% | +10% |
| **Overall** | **37%** | **85%** | **+48%** |

### Test Types Needed
1. **Integration Tests** (20-30 tests)
   - Complete request/response flows
   - Database transactions
   - Error handling paths

2. **E2E Tests** (5-10 tests)
   - Upload → Analyze → Export flow
   - Project creation → File upload → Analysis
   - Authentication → Authorization flows

3. **Performance Tests**
   - Load testing with Locust
   - 100 concurrent users
   - Response time targets (<2s per request)

---

## 📊 Recommended Priority Order

### Week 2 (This Week) - SERVICE LAYER
1. ✅ **Phase 2.2**: Create ProjectService (HIGH) - 6-8h
2. ✅ **Phase 2.3**: Create AnalysisService (MEDIUM) - 4-6h
3. ✅ **Phase 2.4**: Refactor routes (HIGH) - 4-6h
4. **Coverage Target**: 50%+

### Week 3 - CODE QUALITY
1. **Phase 3.1**: Pydantic v2 migration (HIGH) - 2-3h
2. **Phase 3.2**: SQLAlchemy 2.0 migration (HIGH) - 1-2h
3. **Phase 3.3**: Datetime deprecation (HIGH) - 1h
4. **Phase 3.4**: Add type hints (MEDIUM) - 2-3h
5. **Coverage Target**: 60%+

### Week 4 - ARCHITECTURE
1. **Phase 4.1**: Split AIService (MEDIUM) - 4-6h
2. **Phase 4.2**: API versioning (LOW) - 2-3h
3. **Phase 2.5**: Background tasks (LOW) - 3-4h
4. **Coverage Target**: 70%+

### Week 5 - TESTING & QA
1. **Phase 5**: Integration tests (HIGH) - 8-10h
2. **Phase 5**: E2E tests (MEDIUM) - 4-6h
3. **Phase 5**: Performance tests (LOW) - 2-3h
4. **Coverage Target**: 85%+

---

## 🚀 Quick Wins (Do First)

### Immediate Impact (1-2 hours each)
1. ✅ **Fix datetime deprecations** - Replace utcnow() everywhere
2. ✅ **Pydantic v2 Config** - Replace 7 deprecated classes
3. ✅ **SQLAlchemy imports** - Update declarative_base
4. ✅ **Add __all__** exports - Better IDE autocomplete
5. ✅ **Create constants.py** - Centralize magic numbers

### Medium Impact (2-4 hours each)
1. **ProjectService** - Biggest route complexity reduction
2. **AnalysisService** - Separates concerns cleanly
3. **Integration tests** - Catches real bugs

---

## 📈 Success Metrics

### By Week 2 End
- [ ] 50%+ overall coverage
- [ ] ProjectService with 100% coverage
- [ ] AnalysisService with 100% coverage
- [ ] All project routes refactored
- [ ] All analyze routes refactored

### By Week 3 End
- [ ] 60%+ overall coverage
- [ ] Zero deprecation warnings
- [ ] Mypy strict mode passing
- [ ] All constants centralized

### By Week 4 End
- [ ] 70%+ overall coverage
- [ ] API v1 namespace created
- [ ] AIService split into focused services
- [ ] Background tasks for exports

### By Week 5 End
- [ ] 85%+ overall coverage
- [ ] 30+ integration tests
- [ ] 10+ E2E tests
- [ ] Performance benchmarks documented
- [ ] Security audit passed

---

**Last Updated**: 2025-11-14  
**Next Action**: Start Phase 2.2 (Create ProjectService with TDD)
