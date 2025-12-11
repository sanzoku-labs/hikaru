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
}

export function PageHeaderView({
  title,
  description,
  backButton,
  actions,
  className,
}: PageHeaderViewProps) {
  return (
    <header className={cn('mb-8 animate-in-up', className)}>
      {/* Back button */}
      {backButton && (
        <button
          onClick={backButton.onClick}
          className={cn(
            'inline-flex items-center gap-1 mb-4 text-sm text-muted-foreground',
            'transition-colors duration-200 hover:text-foreground',
            'group'
          )}
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          {backButton.label}
        </button>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* Title with subtle gradient accent */}
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
            {title}
          </h1>

          {/* Description */}
          {description && (
            <p className="mt-2 text-muted-foreground leading-relaxed max-w-2xl">
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
      <div className="mt-6 h-px bg-gradient-to-r from-border via-border/50 to-transparent" />
    </header>
  )
}
