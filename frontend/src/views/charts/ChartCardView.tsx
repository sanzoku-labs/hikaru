import { cn } from '@/lib/utils'
import { Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ChartCardViewProps {
  title: string
  insight?: string
  children: React.ReactNode
  className?: string
}

export function ChartCardView({
  title,
  insight,
  children,
  className,
}: ChartCardViewProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Chart container */}
        <div className="px-4 pb-2">{children}</div>

        {/* AI Insight */}
        {insight && (
          <div className="px-4 pb-4 pt-2 border-t border-border mt-2">
            <div className="flex gap-2">
              <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                {insight}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
