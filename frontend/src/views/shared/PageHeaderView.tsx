import { cn } from '@/lib/utils'
import { ChevronLeft } from 'lucide-react'

interface PageHeaderViewProps {
  title: string
  description?: string
  backButton?: {
    label: string
    onClick: () => void
  }
  actions?: React.ReactNode
  className?: string
  /** Reduces spacing and text sizes for compact layouts */
  compact?: boolean
}

export function PageHeaderView({
  title,
  description,
  backButton,
  actions,
  className,
  compact = false,
}: PageHeaderViewProps) {
  return (
    <header className={cn('animate-in-up', compact ? 'mb-4' : 'mb-8', className)}>
      {/* Back button */}
      {backButton && (
        <button
          onClick={backButton.onClick}
          className={cn(
            'inline-flex items-center gap-1 text-sm text-muted-foreground',
            'transition-colors duration-200 hover:text-foreground',
            'group',
            compact ? 'mb-2' : 'mb-4'
          )}
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          {backButton.label}
        </button>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* Title */}
          <h1
            className={cn(
              'font-semibold text-foreground tracking-tight',
              compact ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl'
            )}
          >
            {title}
          </h1>

          {/* Description */}
          {description && (
            <p
              className={cn(
                'text-muted-foreground leading-relaxed max-w-2xl',
                compact ? 'mt-1 text-sm' : 'mt-2'
              )}
            >
              {description}
            </p>
          )}
        </div>

        {/* Actions slot */}
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Subtle divider with gradient */}
      <div
        className={cn(
          'h-px bg-gradient-to-r from-border via-border/50 to-transparent',
          compact ? 'mt-3' : 'mt-6'
        )}
      />
    </header>
  )
}
