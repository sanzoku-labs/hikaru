import { cn } from '@/lib/utils'

interface LoadingSpinnerViewProps {
  size?: 'sm' | 'md' | 'lg'
  label?: string
  className?: string
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
}

export function LoadingSpinnerView({
  size = 'md',
  label,
  className,
}: LoadingSpinnerViewProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3', className)}
      role="status"
      aria-label={label || 'Loading'}
    >
      {/* Spinner with Hikaru glow effect */}
      <div className="relative">
        {/* Glow background */}
        <div
          className={cn(
            'absolute inset-0 rounded-full blur-md bg-primary/30',
            'animate-pulse'
          )}
        />

        {/* Spinner */}
        <div
          className={cn(
            'relative rounded-full border-primary/20 border-t-primary',
            'animate-spin',
            sizeClasses[size]
          )}
          style={{ animationDuration: '0.8s' }}
        />
      </div>

      {/* Label */}
      {label && (
        <span className="text-sm text-muted-foreground animate-pulse">
          {label}
        </span>
      )}

      {/* Screen reader text */}
      <span className="sr-only">{label || 'Loading...'}</span>
    </div>
  )
}
