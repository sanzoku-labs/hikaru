import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { LoadingSpinnerView } from '@/views/shared'
import { Toaster } from '@/components/ui/sonner'
import { useUIStore } from '@/stores/uiStore'

// Lazy load pages for code splitting
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const QuickAnalysisPage = lazy(() => import('@/pages/QuickAnalysisPage'))
const AssistantPage = lazy(() => import('@/pages/AssistantPage'))
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage'))
const ProjectDetailPage = lazy(() => import('@/pages/ProjectDetailPage'))
const ProjectFileAnalysisPage = lazy(() => import('@/pages/projects/ProjectFileAnalysisPage'))
const FileComparisonPage = lazy(() => import('@/pages/projects/FileComparisonPage'))
const FileMergePage = lazy(() => import('@/pages/projects/FileMergePage'))
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'))
const HistoryPage = lazy(() => import('@/pages/HistoryPage'))
const DashboardPage = lazy(() => import('@/pages/projects/DashboardPage'))
const ReportsPage = lazy(() =>
  import('@/pages/ReportsPage').then((m) => ({ default: m.ReportsPage }))
)
const IntegrationsPage = lazy(() =>
  import('@/pages/IntegrationsPage').then((m) => ({ default: m.IntegrationsPage }))
)
const OAuthCallbackPage = lazy(() => import('@/pages/OAuthCallbackPage'))

// Full-page loading fallback
function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <LoadingSpinnerView size="lg" label="Loading..." />
    </div>
  )
}

// Initialize theme on mount
function ThemeInitializer() {
  const theme = useUIStore((state) => state.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return null
}

// Wrapper that provides route-level error boundary with location-based reset
function ProtectedRouteWithErrorBoundary({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  return (
    <ProtectedRoute>
      <RouteErrorBoundary key={location.pathname}>
        {children}
      </RouteErrorBoundary>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeInitializer />
        <Toaster />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes with error boundaries */}
            <Route
              path="/"
              element={
                <ProtectedRouteWithErrorBoundary>
                  <QuickAnalysisPage />
                </ProtectedRouteWithErrorBoundary>
              }
            />

            <Route
              path="/assistant"
              element={
                <ProtectedRouteWithErrorBoundary>
                  <AssistantPage />
                </ProtectedRouteWithErrorBoundary>
              }
            />

            <Route
              path="/projects"
              element={
                <ProtectedRouteWithErrorBoundary>
                  <ProjectsPage />
                </ProtectedRouteWithErrorBoundary>
              }
            />

            <Route
              path="/projects/:projectId"
              element={
                <ProtectedRouteWithErrorBoundary>
                  <ProjectDetailPage />
                </ProtectedRouteWithErrorBoundary>
              }
            />

            <Route
              path="/projects/:projectId/files/:fileId/analyze"
              element={
                <ProtectedRouteWithErrorBoundary>
                  <ProjectFileAnalysisPage />
                </ProtectedRouteWithErrorBoundary>
              }
            />

            <Route
              path="/projects/:projectId/compare"
              element={
                <ProtectedRouteWithErrorBoundary>
                  <FileComparisonPage />
                </ProtectedRouteWithErrorBoundary>
              }
            />

            <Route
              path="/projects/:projectId/merge"
              element={
                <ProtectedRouteWithErrorBoundary>
                  <FileMergePage />
                </ProtectedRouteWithErrorBoundary>
              }
            />

            <Route
              path="/analytics"
              element={
                <ProtectedRouteWithErrorBoundary>
                  <AnalyticsPage />
                </ProtectedRouteWithErrorBoundary>
              }
            />

            <Route
              path="/history"
              element={
                <ProtectedRouteWithErrorBoundary>
                  <HistoryPage />
                </ProtectedRouteWithErrorBoundary>
              }
            />

            <Route
              path="/projects/:projectId/dashboards/:dashboardId"
              element={
                <ProtectedRouteWithErrorBoundary>
                  <DashboardPage />
                </ProtectedRouteWithErrorBoundary>
              }
            />

            <Route
              path="/reports"
              element={
                <ProtectedRouteWithErrorBoundary>
                  <ReportsPage />
                </ProtectedRouteWithErrorBoundary>
              }
            />

            <Route
              path="/integrations"
              element={
                <ProtectedRouteWithErrorBoundary>
                  <IntegrationsPage />
                </ProtectedRouteWithErrorBoundary>
              }
            />

            <Route
              path="/integrations/callback"
              element={
                <ProtectedRouteWithErrorBoundary>
                  <OAuthCallbackPage />
                </ProtectedRouteWithErrorBoundary>
              }
            />

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
