import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { AppLayoutView } from '@/views/layout'
import { useLogout } from '@/services/api/mutations/useLogout'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation()
  const { isAuthenticated, user } = useAuthStore()
  const { sidebarCollapsed, theme, toggleSidebar, setTheme } = useUIStore()
  const logoutMutation = useLogout()

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const handleLogout = () => {
    logoutMutation.mutate()
  }

  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <AppLayoutView
      user={user}
      theme={theme}
      sidebarCollapsed={sidebarCollapsed}
      onSidebarToggle={toggleSidebar}
      onLogout={handleLogout}
      onThemeToggle={handleThemeToggle}
    >
      {children}
    </AppLayoutView>
  )
}
