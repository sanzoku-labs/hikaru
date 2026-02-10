import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Route-level error boundary.
 * Unlike the root ErrorBoundary, this provides navigation back
 * and resets on route changes via key prop.
 */
export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('RouteErrorBoundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  handleBack = () => {
    if (window.history.length <= 1) {
      window.location.href = '/'
    } else {
      window.history.back()
    }
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-sm w-full text-center">
            <div className="mb-4 inline-flex">
              <div
                className={cn(
                  'p-3 rounded-xl',
                  'bg-destructive/10 text-destructive'
                )}
              >
                <AlertTriangle className="h-8 w-8" />
              </div>
            </div>

            <h2 className="text-lg font-semibold text-foreground mb-2">
              Something went wrong
            </h2>

            <p className="text-sm text-muted-foreground mb-4">
              This page encountered an error. Try refreshing or go back.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <div className="mb-4 p-3 rounded-lg bg-muted/50 text-left">
                <p className="text-xs font-mono text-muted-foreground break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex items-center justify-center gap-2">
              <Button variant="secondary" onClick={this.handleBack}>
                <ArrowLeft className="h-4 w-4" />
                Go back
              </Button>
              <Button variant="default" onClick={this.handleRetry}>
                <RefreshCw className="h-4 w-4" />
                Try again
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
