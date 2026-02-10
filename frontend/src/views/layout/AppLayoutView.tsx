import { cn } from '@/lib/utils'
import { SidebarView } from './SidebarView'
import { HeaderView } from './HeaderView'
import type { UserResponse } from '@/types/api'

interface AppLayoutViewProps {
  children: React.ReactNode
  user: UserResponse | null
  theme: 'light' | 'dark'
  sidebarCollapsed: boolean
  onSidebarToggle: () => void
  onLogout: () => void
  onThemeToggle: () => void
}

export function AppLayoutView({
  children,
  user,
  theme,
  sidebarCollapsed,
  onSidebarToggle,
  onLogout,
  onThemeToggle,
}: AppLayoutViewProps) {
  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Sidebar */}
      <SidebarView
        collapsed={sidebarCollapsed}
        onToggle={onSidebarToggle}
      />

      {/* Header */}
      <HeaderView
        user={user}
        theme={theme}
        sidebarCollapsed={sidebarCollapsed}
        onLogout={onLogout}
        onThemeToggle={onThemeToggle}
      />

      {/* Main content area */}
      <main
        id="main-content"
        className={cn(
          'min-h-screen pt-16',
          'transition-all duration-300',
          sidebarCollapsed ? 'pl-[72px]' : 'pl-[260px]'
        )}
      >
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
