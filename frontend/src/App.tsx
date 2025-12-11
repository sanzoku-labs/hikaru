import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { LoadingSpinnerView } from '@/views/shared'
import { useUIStore } from '@/stores/uiStore'

// Lazy load pages for code splitting
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const QuickAnalysisPage = lazy(() => import('@/pages/QuickAnalysisPage'))
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage'))
const ProjectDetailPage = lazy(() => import('@/pages/ProjectDetailPage'))
const ProjectFileAnalysisPage = lazy(() => import('@/pages/projects/ProjectFileAnalysisPage'))

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

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeInitializer />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <QuickAnalysisPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <ProjectsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/projects/:projectId"
              element={
                <ProtectedRoute>
                  <ProjectDetailPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/projects/:projectId/files/:fileId/analyze"
              element={
                <ProtectedRoute>
                  <ProjectFileAnalysisPage />
                </ProtectedRoute>
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
