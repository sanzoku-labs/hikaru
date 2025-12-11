import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center animate-in-up">
            {/* Error icon with glow */}
            <div className="mb-6 inline-flex">
              <div
                className={cn(
                  'p-4 rounded-2xl',
                  'bg-destructive/10 text-destructive',
                  'ring-1 ring-destructive/20'
                )}
              >
                <AlertTriangle className="h-12 w-12" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              Something went wrong
            </h1>

            {/* Description */}
            <p className="text-muted-foreground mb-6 leading-relaxed">
              We encountered an unexpected error. This has been logged and we'll look into it.
            </p>

            {/* Error details (development only) */}
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 p-4 rounded-lg bg-muted/50 text-left">
                <p className="text-xs font-mono text-muted-foreground break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
                  'bg-primary text-primary-foreground font-medium',
                  'transition-all duration-200',
                  'hover:bg-primary/90',
                  'focus:outline-none focus:ring-2 focus:ring-primary/50'
                )}
              >
                <RefreshCw className="h-4 w-4" />
                Try again
              </button>

              <button
                onClick={this.handleGoHome}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
                  'bg-secondary text-secondary-foreground font-medium',
                  'transition-all duration-200',
                  'hover:bg-secondary/80',
                  'focus:outline-none focus:ring-2 focus:ring-secondary/50'
                )}
              >
                <Home className="h-4 w-4" />
                Go home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
