import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

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
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
