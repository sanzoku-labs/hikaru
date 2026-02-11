import { cn } from '@/lib/utils'
import {
  Sun,
  Moon,
  LogOut,
  User,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { UserResponse } from '@/types/api'

interface HeaderViewProps {
  user: UserResponse | null
  theme: 'light' | 'dark'
  onLogout: () => void
  onThemeToggle: () => void
  sidebarCollapsed: boolean
}

export function HeaderView({
  user,
  theme,
  onLogout,
  onThemeToggle,
  sidebarCollapsed,
}: HeaderViewProps) {
  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.username?.slice(0, 2).toUpperCase() || '??'

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-16',
        'bg-background/80 backdrop-blur-xl',
        'border-b border-border',
        'transition-all duration-300',
        sidebarCollapsed ? 'left-[72px]' : 'left-[240px]'
      )}
    >
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left side - can add breadcrumbs or page title */}
        <div className="flex-1" />

        {/* Right side - actions */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onThemeToggle}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto p-1.5 pr-3"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground hidden sm:block">
                  {user?.full_name || user?.username}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.full_name || user?.username}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem disabled className="gap-2">
                <User className="h-4 w-4" />
                Profile
                <span className="ml-auto text-xs text-muted-foreground">Soon</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={onLogout}
                className="gap-2 text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
