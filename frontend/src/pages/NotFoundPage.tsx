import { Link } from 'react-router-dom'
import { FileQuestion, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center animate-in-up">
        <div className="mb-6 inline-flex">
          <div className="p-4 rounded-2xl bg-muted text-muted-foreground">
            <FileQuestion className="h-12 w-12" />
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Page not found
        </h1>

        <p className="text-muted-foreground mb-6 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Button variant="secondary" asChild>
            <Link to="/" className="inline-flex items-center gap-2">
              <Home className="h-4 w-4" />
              Go home
            </Link>
          </Button>
          <Button
            variant="default"
            onClick={() => window.history.length > 1 ? window.history.back() : window.location.replace('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go back
          </Button>
        </div>
      </div>
    </div>
  )
}
