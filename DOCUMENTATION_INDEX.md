# Hikaru Documentation Index

**Last Updated**: November 14, 2025  
**Purpose**: Single source of truth for finding documentation

---

## 📍 START HERE

**New to the project?**  
→ [`README.md`](README.md) - Quick overview and setup  
→ [`docs/GETTING_STARTED.md`](docs/GETTING_STARTED.md) - Detailed setup guide

**Already set up?**  
→ [`PROGRESS.md`](PROGRESS.md) - Current status and what's been built  
→ [`docs/completed/`](docs/completed/) - See what phases are done

**Contributing or developing?**  
→ [`CLAUDE.md`](CLAUDE.md) - Development guidelines and architecture

---

## 🎯 Documentation by Purpose

### I want to... SET UP the project
1. **Quick setup (5 min)**: [`README.md`](README.md) → "Quick Start" section
2. **Detailed setup**: [`docs/GETTING_STARTED.md`](docs/GETTING_STARTED.md)
3. **Troubleshooting**: [`docs/GETTING_STARTED.md`](docs/GETTING_STARTED.md) → "Common Issues"

### I want to... UNDERSTAND what's been built
1. **Overall status**: [`PROGRESS.md`](PROGRESS.md) ← **READ THIS FIRST**
2. **Backend status**: [`backend/README.md`](backend/README.md)
3. **Phase completions**: [`docs/completed/`](docs/completed/)
   - [`PHASE_7_PROJECTS.md`](docs/completed/PHASE_7_PROJECTS.md) - Multi-file projects
   - [`PHASE_8_AUTHENTICATION.md`](docs/completed/PHASE_8_AUTHENTICATION.md) - JWT auth
   - [`PHASE_9_UI_REDESIGN.md`](docs/completed/PHASE_9_UI_REDESIGN.md) - UI overhaul
   - [`WEEK_3_REFACTORING.md`](docs/completed/WEEK_3_REFACTORING.md) - Code quality

### I want to... USE a specific feature
1. **Authentication**: [`docs/features/AUTHENTICATION.md`](docs/features/AUTHENTICATION.md)
2. **Projects**: [`docs/features/PROJECTS.md`](docs/features/PROJECTS.md)
3. **API Reference**: http://localhost:8000/docs (when backend is running)

### I want to... DEVELOP or REFACTOR
1. **Architecture guide**: [`CLAUDE.md`](CLAUDE.md) ← **Development guidelines**
2. **Refactoring roadmap**: [`backend/REFACTORING_ROADMAP.md`](backend/REFACTORING_ROADMAP.md)
3. **Current work**: [`PROGRESS.md`](PROGRESS.md) → "Latest Achievements"
4. **Backend internals**: [`backend/README.md`](backend/README.md)

### I want to... UNDERSTAND the history
1. **Original design docs**: [`docs/archive/`](docs/archive/)
   - Original PRD, wireframes, specifications
   - **Note**: These are historical - see `PROGRESS.md` for current status

---

## 📁 File Organization

### Root Level (Most Important)
```
README.md                    ← Project overview + quick start
PROGRESS.md                  ← Current status (UPDATE THIS OFTEN)
CLAUDE.md                    ← Development guidelines
DOCUMENTATION_INDEX.md       ← This file
```

### Backend Documentation
```
backend/
├── README.md                ← Backend-specific guide
├── REFACTORING_ROADMAP.md   ← 5-week refactoring plan
├── PHASE_1_COMPLETE.md      ← Historical
├── PHASE_2_PROGRESS.md      ← Historical
└── NEXT_STEPS.md            ← Historical
```

### Organized Documentation
```
docs/
├── README.md                ← Documentation overview
├── GETTING_STARTED.md       ← Setup guide
│
├── completed/               ← Phase completion documents
│   ├── PHASE_7_PROJECTS.md
│   ├── PHASE_8_AUTHENTICATION.md
│   ├── PHASE_9_UI_REDESIGN.md
│   └── WEEK_3_REFACTORING.md
│
├── features/                ← Feature usage guides
│   ├── AUTHENTICATION.md
│   └── PROJECTS.md
│
└── archive/                 ← Historical documents
    ├── 00_ORIGINAL_README.md
    ├── 01_DSB_PRD_v1.1.md
    ├── 02_CLAUDE_CODE_PROMPT.md
    ├── 03_DAY_1_QUICK_START.md
    └── 04_HOW_TO_USE_THESE_DOCS.md
```

---

## 🎯 Quick Reference by Role

### As a NEW DEVELOPER
**Day 1 Reading Order:**
1. [`README.md`](README.md) - Get the big picture (5 min)
2. [`docs/GETTING_STARTED.md`](docs/GETTING_STARTED.md) - Set up your environment (15 min)
3. [`PROGRESS.md`](PROGRESS.md) - Understand current status (10 min)
4. [`CLAUDE.md`](CLAUDE.md) - Learn development patterns (15 min)
5. Run the app! 🚀

**Total time**: ~45 minutes to productive

### As a MAINTAINER
**Regular checks:**
- [`PROGRESS.md`](PROGRESS.md) - Daily updates on progress
- [`backend/REFACTORING_ROADMAP.md`](backend/REFACTORING_ROADMAP.md) - Current week's work
- [`docs/completed/`](docs/completed/) - What's been delivered

**After completing work:**
- Update [`PROGRESS.md`](PROGRESS.md)
- Create completion doc in [`docs/completed/`](docs/completed/)
- Update this index if structure changes

### As a STAKEHOLDER
**Quick status check:**
1. [`PROGRESS.md`](PROGRESS.md) → "📊 Current Status" section
2. [`PROGRESS.md`](PROGRESS.md) → "🚀 Latest Achievements" section
3. [`docs/completed/`](docs/completed/) → See detailed phase results

### As a API CONSUMER
**API documentation:**
1. Start backend: `cd backend && poetry run uvicorn app.main:app --reload`
2. Visit: http://localhost:8000/docs (Swagger UI)
3. Alternative: http://localhost:8000/redoc (ReDoc)

---

## 🔄 Documentation Update Rules

### When to Update PROGRESS.md
- ✅ After completing any phase/feature
- ✅ After significant refactoring work
- ✅ When changing overall project status
- ✅ At the start of new major work (add "Next Steps")

### When to Create a Completion Doc
Create a new file in `docs/completed/` when:
- ✅ Finishing a full phase (Phase 7, 8, 9, etc.)
- ✅ Completing a major refactoring week
- ✅ Shipping a significant feature set

**Template**: Use [`docs/completed/WEEK_3_REFACTORING.md`](docs/completed/WEEK_3_REFACTORING.md) as reference

### When to Update This Index
- ✅ Adding new documentation files
- ✅ Restructuring docs/ directory
- ✅ Adding new documentation categories

**Keep it simple**: This file should always be scannable in < 2 minutes

---

## 🗂️ Documentation Standards

### File Naming
- **Root-level docs**: `SCREAMING_SNAKE_CASE.md`
- **Subdirectory docs**: `PascalCase.md` or `snake_case.md`
- **Phase completions**: `PHASE_N_DESCRIPTION.md` or `WEEK_N_DESCRIPTION.md`

### Document Structure
Every doc should have:
1. **Title + metadata** (date, status)
2. **Purpose/Overview** (what is this doc?)
3. **Table of Contents** (if > 200 lines)
4. **Body content**
5. **Related links** (see also...)

### Keep Updated
- `PROGRESS.md` - Update after every significant milestone
- `README.md` - Update if setup process changes
- Completion docs - Write once, don't update (historical record)

---

## 📊 Current Documentation Health

| Category | Count | Status |
|----------|-------|--------|
| Root-level guides | 4 | ✅ Good |
| Completion docs | 4 | ✅ Good |
| Feature guides | 2 | ✅ Good |
| Archive docs | 5 | ✅ Archived |
| Backend docs | 4 | ⚠️ Some outdated |

**Outdated docs to remove/update:**
- `backend/NEXT_STEPS.md` - Superseded by `backend/REFACTORING_ROADMAP.md`
- `backend/PHASE_1_COMPLETE.md` - Move to `docs/completed/` or remove
- `backend/PHASE_2_PROGRESS.md` - Move to `docs/completed/` or remove

---

## 🎯 Common Questions

**Q: Which doc tells me the current project status?**  
A: [`PROGRESS.md`](PROGRESS.md) - This is the **single source of truth** for status.

**Q: Where do I find setup instructions?**  
A: [`docs/GETTING_STARTED.md`](docs/GETTING_STARTED.md) for detailed setup, [`README.md`](README.md) for quick start.

**Q: How do I know what's been built?**  
A: [`PROGRESS.md`](PROGRESS.md) for overview, [`docs/completed/`](docs/completed/) for detailed phase docs.

**Q: Where are the API docs?**  
A: http://localhost:8000/docs (auto-generated from code when backend is running)

**Q: Where's the refactoring plan?**  
A: [`backend/REFACTORING_ROADMAP.md`](backend/REFACTORING_ROADMAP.md) - 5-week structured plan

**Q: What should I read if I'm joining the project today?**  
A: Follow the "As a NEW DEVELOPER" reading order above ↑

**Q: Where do I document a new feature?**  
A: 
1. Update [`PROGRESS.md`](PROGRESS.md) with status
2. Create completion doc in [`docs/completed/`](docs/completed/)
3. If user-facing, add guide to [`docs/features/`](docs/features/)

**Q: Too many docs! Which one is authoritative?**  
A: Priority order (most authoritative first):
1. [`PROGRESS.md`](PROGRESS.md) - Current state
2. [`docs/completed/`](docs/completed/) - Historical completions
3. [`CLAUDE.md`](CLAUDE.md) - Development patterns
4. [`README.md`](README.md) - Project overview

---

## 🚀 Next Steps

After reading this index:

1. **If setting up**: → [`docs/GETTING_STARTED.md`](docs/GETTING_STARTED.md)
2. **If understanding status**: → [`PROGRESS.md`](PROGRESS.md)
3. **If developing**: → [`CLAUDE.md`](CLAUDE.md)
4. **If using features**: → [`docs/features/`](docs/features/)

---

**Last Updated**: November 14, 2025  
**Maintained by**: Development team  
**Update frequency**: When documentation structure changes
