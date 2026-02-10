import { cn } from '@/lib/utils'
import { FEATURES } from '@/config/features'
import { Link, useLocation } from 'react-router-dom'
import {
  Zap,
  MessageSquare,
  FolderKanban,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Clock,
  FileText,
  Link2,
} from 'lucide-react'

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
}

interface SidebarViewProps {
  collapsed: boolean
  onToggle: () => void
}

const navItems: NavItem[] = [
  {
    label: 'Quick Analysis',
    path: '/',
    icon: <Zap className="h-5 w-5" />,
  },
  {
    label: 'AI Assistant',
    path: '/assistant',
    icon: <MessageSquare className="h-5 w-5" />,
  },
  {
    label: 'Projects',
    path: '/projects',
    icon: <FolderKanban className="h-5 w-5" />,
  },
  {
    label: 'Reports',
    path: '/reports',
    icon: <FileText className="h-5 w-5" />,
  },
  {
    label: 'Integrations',
    path: '/integrations',
    icon: <Link2 className="h-5 w-5" />,
  },
  {
    label: 'History',
    path: '/history',
    icon: <Clock className="h-5 w-5" />,
  },
  {
    label: 'Analytics',
    path: '/analytics',
    icon: <BarChart3 className="h-5 w-5" />,
  },
]

export function SidebarView({ collapsed, onToggle }: SidebarViewProps) {
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen',
        'bg-card border-r border-border',
        'transition-all duration-300 ease-out',
        'flex flex-col',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Logo area */}
      <div className="h-16 flex items-center px-4 border-b border-border">
        <Link to="/" className="flex items-center gap-3 group">
          {/* Logo mark */}
          <div
            className={cn(
              'flex items-center justify-center',
              'w-10 h-10 rounded-xl',
              'bg-gradient-to-br from-primary to-accent',
              'shadow-lg shadow-primary/20',
              'transition-all duration-300',
              'group-hover:shadow-primary/40 group-hover:scale-105'
            )}
          >
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>

          {/* Logo text */}
          <div
            className={cn(
              'overflow-hidden transition-all duration-300',
              collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
            )}
          >
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Hikaru
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.filter((item) => {
            if (item.path === '/integrations') return FEATURES.integrations
            return true
          }).map((item) => {
            const active = isActive(item.path)
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                    'transition-all duration-200',
                    'group relative',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {/* Active indicator */}
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                  )}

                  {/* Icon */}
                  <span
                    className={cn(
                      'flex-shrink-0 transition-transform duration-200',
                      !collapsed && 'group-hover:scale-110'
                    )}
                  >
                    {item.icon}
                  </span>

                  {/* Label */}
                  <span
                    className={cn(
                      'font-medium text-sm whitespace-nowrap',
                      'transition-all duration-300',
                      collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-border">
        <button
          onClick={onToggle}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg',
            'text-muted-foreground text-sm',
            'transition-colors duration-200',
            'hover:bg-muted hover:text-foreground'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
