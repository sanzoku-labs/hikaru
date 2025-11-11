import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <div className="cursor-pointer" onClick={() => navigate('/')}>
              <h1 className="text-2xl font-bold">Hikaru</h1>
              <p className="text-sm text-muted-foreground">AI Data Insight Board</p>
            </div>
            <nav className="flex gap-2">
              <Button variant="ghost" onClick={() => navigate('/')}>
                Quick Analysis
              </Button>
              <Button variant="ghost" onClick={() => navigate('/projects')}>
                Projects
              </Button>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {user?.username || user?.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logout()
                navigate('/login')
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-4 text-sm text-muted-foreground text-center">
          Powered by Sanzoku Labs
        </div>
      </footer>
    </div>
  )
}
