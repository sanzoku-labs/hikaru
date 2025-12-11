import { cn } from '@/lib/utils'
import { Sparkles } from 'lucide-react'

interface GlobalSummaryViewProps {
  summary: string
}

export function GlobalSummaryView({ summary }: GlobalSummaryViewProps) {
  return (
    <div
      className={cn(
        'relative p-6 rounded-2xl overflow-hidden',
        'bg-gradient-to-br from-primary/10 via-card to-accent/10',
        'border border-primary/20',
        'animate-in-up'
      )}
    >
      {/* Decorative glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />

      <div className="relative flex gap-4">
        {/* Icon */}
        <div
          className={cn(
            'flex-shrink-0 p-3 rounded-xl',
            'bg-primary/20 text-primary'
          )}
        >
          <Sparkles className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-primary mb-2">AI Summary</h3>
          <p className="text-foreground leading-relaxed">{summary}</p>
        </div>
      </div>
    </div>
  )
}
