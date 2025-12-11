import { cn } from '@/lib/utils'

interface EmptyStateViewProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyStateView({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateViewProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center animate-in-fade',
        className
      )}
    >
      {/* Icon container with subtle glow */}
      {icon && (
        <div className="mb-6 p-4 rounded-2xl bg-muted/50 text-muted-foreground">
          {icon}
        </div>
      )}

      {/* Title */}
      <h3 className="text-xl font-semibold text-foreground mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-muted-foreground max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {/* Action button */}
      {action && (
        <button
          onClick={action.onClick}
          className={cn(
            'inline-flex items-center gap-2 px-5 py-2.5 rounded-lg',
            'bg-primary text-primary-foreground font-medium',
            'transition-all duration-200',
            'hover:bg-primary/90 hover:glow-primary-sm',
            'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background'
          )}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
