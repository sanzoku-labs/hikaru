# Hikaru Frontend

Modern React TypeScript frontend for the Hikaru AI-powered data analytics dashboard.

## Tech Stack

- **React 18.3.1** - UI framework
- **TypeScript 5.6.3** - Type safety
- **Vite 6.0.1** - Build tool with SWC (20x faster than Babel)
- **Tailwind CSS 3.4.14** - Utility-first styling
- **shadcn/ui** - Component library (Radix UI + Tailwind)
- **TanStack Query 5.59.20** - Server state management
- **Zustand 5.0.1** - Client state management
- **React Router 6.27.0** - Routing
- **React Hook Form 7.53.2** - Form handling
- **Zod 3.23.8** - Schema validation
- **Axios 1.7.7** - HTTP client
- **ECharts 5.5.1** - Charts

## Project Structure

```
src/
├── pages/              # Route-level components (lazy loaded)
│   ├── auth/          # Login, Register
│   └── ...
├── components/        # Reusable components
│   ├── ui/           # shadcn/ui primitives
│   └── layout/       # Layout components
├── services/         # API services
│   ├── api/         # TanStack Query hooks
│   ├── axios.ts     # Axios instance with interceptors
│   └── endpoints.ts # API endpoint constants
├── stores/          # Zustand stores
│   └── authStore.ts # Authentication state
├── types/           # TypeScript types
├── lib/             # Utility functions
└── styles/          # Global CSS
```

## Quick Start

### Install Dependencies

```bash
npm install
```

### Development Server

```bash
npm run dev
```

Frontend runs at: http://localhost:5173

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Environment Variables

Create `.env.development` and `.env.production`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Features Implemented

### ✅ Day 1-2: Project Setup
- Vite + React + TypeScript initialized
- All 333 dependencies installed
- TypeScript strict mode configured
- Tailwind CSS with design system tokens
- Code splitting configured

### ✅ Day 3-4: Authentication
- Axios service with JWT interceptors
- Zustand auth store with persistence
- TanStack Query auth mutations (login, register, logout)
- Login page with validation
- Register page with validation
- Protected route component
- Auth flow end-to-end

### ✅ Day 5: Layout Infrastructure
- UI store (Zustand) for sidebar/theme state
- AppLayout wrapper component with Outlet
- Sidebar component (collapsible, 240px/64px, 200ms animation)
- Header component (breadcrumbs, theme toggle, user menu)
- Navigation with active state highlighting
- Dark mode support (theme toggle functional)
- User avatar with initials fallback
- Logout functionality in user menu

### ✅ Day 6-7: File Upload Component
- FileUploader component with react-dropzone
- Drag-drop zone with visual feedback (scale, color transitions)
- Accept CSV/XLSX/XLS files (30MB max)
- File validation with error messages
- UploadProgress component with animated stages
- Progress indicators (uploading → processing → analyzing)
- DataPreview component with schema display
- Table preview with bi-directional scrolling
- Column type icons (numeric, categorical, datetime)
- useUploadFile mutation (TanStack Query)
- useAnalyzeFile mutation (TanStack Query)
- QuickAnalysis page with complete upload flow
- Error handling and retry logic

### ✅ Day 8-9: Chart Components
- ChartCard wrapper component with title and AI insights
- LineChart component (smooth lines, area fill, datetime support)
- BarChart component (rounded corners, hover effects)
- PieChart component (donut style, legend, 8-color palette)
- ScatterChart component (correlation visualization)
- ChartGrid responsive layout (2-column grid)
- GlobalSummary component for AI dataset insights
- ECharts integration with 400px chart height
- Interactive tooltips on all chart types
- Responsive chart sizing
- Chart type detection and rendering
- Complete QuickAnalysis flow (upload → preview → charts)

### ✅ Day 10: Polish & Export
- Skeleton loading component for charts
- ChartGridSkeleton with animated placeholders
- PDF export mutation with blob download
- Export button with loading state
- ErrorBoundary component for graceful error handling
- Try Again button for error recovery
- New Upload button with icon
- Export PDF button with download icon
- Mobile responsive typography (md: breakpoints)
- Mobile responsive button layout (flex-col on mobile)
- Improved empty states and error messages
- Production build optimization

### ✅ Week 3: Multi-file Projects (Phase 1)
- Project-related TypeScript types (ProjectResponse, ProjectFileResponse, etc.)
- Project API endpoints (LIST, CREATE, DETAIL, DELETE, UPLOAD_FILE)
- useProjects query for fetching project list
- useProjectDetail query for single project with files
- useCreateProject mutation with cache invalidation
- useDeleteProject mutation
- useUploadProjectFile mutation with project context
- Projects list page with grid layout
- Create project form with name and description
- Project cards with file count and timestamps
- Empty state for no projects
- ProjectDetail page with file list
- Multi-file upload to projects
- File cards with schema preview
- Navigation between projects and files
- Mobile responsive project views
- formatDate utility with relative time

## Build Analysis

Production build size (after Week 3):
- React vendor: 163.67 kB → 53.53 kB gzipped
- TanStack libs: 39.50 kB → 11.98 kB gzipped (includes Router)
- **ECharts (lazy-loaded)**: 1,055.99 kB → 349.29 kB gzipped
- QuickAnalysis page: 16.39 kB → 4.65 kB gzipped
- Projects page: 5.59 kB → 1.95 kB gzipped
- ProjectDetail page: 4.54 kB → 1.72 kB gzipped
- FileUploader: 63.91 kB → 18.20 kB gzipped
- Types: 77.82 kB → 21.22 kB gzipped
- shadcn/ui components: 79.75 kB → 26.47 kB gzipped
- Main bundle: 99.65 kB → 35.06 kB gzipped
- **Total initial load**: ~171 kB gzipped ✅ (66% under 500kB target)
- **Charts loaded on demand**: +349 kB gzipped (only when viewing charts)

Performance targets met:
- ✅ Bundle size < 500kB
- ✅ Code splitting working
- ✅ Lazy loading routes

## API Integration

The frontend connects to the FastAPI backend at `http://localhost:8000`.

### Axios Configuration

- Base URL from environment variables
- JWT token automatically attached to requests
- 401 errors trigger automatic logout
- Error messages extracted from backend responses

### Authentication Flow

1. User submits login/register form
2. TanStack Query mutation calls backend API
3. JWT token stored in localStorage
4. Zustand store updated with user data
5. Axios interceptor attaches token to all requests
6. Protected routes check authentication status

## ✅ Quick Analysis MVP Complete!

**Week 2 Completion Status**: 100% Complete

All features for the Quick Analysis MVP have been implemented:
- File upload with drag-drop
- Data preview with schema visualization
- Automatic chart generation (4 types)
- AI-powered insights
- PDF export functionality
- Mobile responsive design
- Error handling and loading states

## ✅ Week 3 Multi-file Projects (Phase 1) Complete!

**Week 3 Completion Status**: 100% Complete

Core project management features implemented:
- Projects list page with grid layout
- Project creation and deletion
- Project detail page with file management
- Multi-file upload to projects
- File list with schema preview
- Navigation and routing

## Next Steps (Week 4: Advanced Project Features)

### Phase 2: File Analysis & Comparison
- [ ] ProjectFileAnalysis page (view charts for individual files)
- [ ] File comparison view (side-by-side diff)
- [ ] File merging functionality (join operations)
- [ ] Project dashboard with aggregated insights
- [ ] Batch file operations

## Development Notes

- All routes are lazy loaded for optimal bundle size
- Forms use React Hook Form + Zod for validation
- Auth state persists in localStorage via Zustand
- JWT expires after 7 days (backend configured)
- Dark mode support ready (toggle coming soon)

## Troubleshooting

### Port already in use
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### TypeScript errors
```bash
# Clean build
rm -rf node_modules dist
npm install
```

### Backend connection issues
Ensure backend is running at `http://localhost:8000` and CORS is configured.

---

**Last Updated**: November 27, 2025
**Status**: Week 3 Multi-file Projects (Phase 1) Complete ✅
