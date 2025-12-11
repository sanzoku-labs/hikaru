import { cn } from '@/lib/utils'
import { AlertCircle, XCircle, RefreshCw } from 'lucide-react'

interface ErrorAlertViewProps {
  title?: string
  message: string
  variant?: 'error' | 'warning'
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
}

export function ErrorAlertView({
  title,
  message,
  variant = 'error',
  onRetry,
  onDismiss,
  className,
}: ErrorAlertViewProps) {
  const isError = variant === 'error'

  return (
    <div
      className={cn(
        'relative rounded-lg border p-4 animate-in-scale',
        isError
          ? 'bg-destructive/10 border-destructive/30 text-destructive'
          : 'bg-primary/10 border-primary/30 text-primary',
        className
      )}
      role="alert"
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <AlertCircle className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="font-semibold mb-1">{title}</h4>
          )}
          <p className={cn(
            'text-sm leading-relaxed',
            isError ? 'text-destructive/90' : 'text-primary/90'
          )}>
            {message}
          </p>

          {/* Actions */}
          {onRetry && (
            <button
              onClick={onRetry}
              className={cn(
                'mt-3 inline-flex items-center gap-1.5 text-sm font-medium',
                'transition-colors duration-200',
                isError
                  ? 'text-destructive hover:text-destructive/80'
                  : 'text-primary hover:text-primary/80'
              )}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try again
            </button>
          )}
        </div>

        {/* Dismiss button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={cn(
              'flex-shrink-0 p-1 rounded-md transition-colors duration-200',
              isError
                ? 'hover:bg-destructive/20'
                : 'hover:bg-primary/20'
            )}
            aria-label="Dismiss"
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
