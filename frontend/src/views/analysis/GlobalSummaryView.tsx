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

      <div className="relative">
        {/* Title with icon */}
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium text-primary">AI Summary</h3>
        </div>

        {/* Content */}
        <p className="text-foreground leading-relaxed">{summary}</p>
      </div>
    </div>
  )
}
