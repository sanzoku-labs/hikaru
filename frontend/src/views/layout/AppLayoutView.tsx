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
