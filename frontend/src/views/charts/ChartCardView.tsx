import { cn } from '@/lib/utils'
import { Sparkles, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ChartCardViewProps {
  title: string
  insight?: string | null
  isLoadingInsight?: boolean
  onGenerateInsight?: () => void
  children: React.ReactNode
  className?: string
}

export function ChartCardView({
  title,
  insight,
  isLoadingInsight,
  onGenerateInsight,
  children,
  className,
}: ChartCardViewProps) {
  const hasInsight = insight && insight.length > 0
  const canGenerateInsight = !hasInsight && onGenerateInsight && !isLoadingInsight

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Chart container */}
        <div className="px-4 pb-2">{children}</div>

        {/* AI Insight section */}
        <div className="px-4 pb-4 pt-2 border-t border-border mt-2">
          {/* Loading state */}
          {isLoadingInsight && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Generating insight...</span>
            </div>
          )}

          {/* Show insight when available */}
          {hasInsight && !isLoadingInsight && (
            <div className="flex gap-2">
              <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                {insight}
              </p>
            </div>
          )}

          {/* Generate insight button */}
          {canGenerateInsight && (
            <button
              onClick={onGenerateInsight}
              className={cn(
                'flex items-center gap-2 text-sm',
                'text-primary hover:text-primary/80',
                'transition-colors duration-200'
              )}
            >
              <Sparkles className="h-4 w-4" />
              <span>Generate AI Insight</span>
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
