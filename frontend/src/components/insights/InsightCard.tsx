/**
 * InsightCard - Colored AI insight card for 2x2 grid layout
 * Matches Mockup 1 (File Analysis) insights section
 */
import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface InsightCardProps {
  title: string
  description: string
  icon: LucideIcon
  color?: 'blue' | 'green' | 'purple' | 'orange'
  className?: string
}

const colorClasses = {
  blue: {
    card: 'bg-blue-50 border-blue-200',
    icon: 'bg-blue-100 text-blue-600',
    title: 'text-blue-900',
  },
  green: {
    card: 'bg-emerald-50 border-emerald-200',
    icon: 'bg-emerald-100 text-emerald-600',
    title: 'text-emerald-900',
  },
  purple: {
    card: 'bg-purple-50 border-purple-200',
    icon: 'bg-purple-100 text-purple-600',
    title: 'text-purple-900',
  },
  orange: {
    card: 'bg-orange-50 border-orange-200',
    icon: 'bg-orange-100 text-orange-600',
    title: 'text-orange-900',
  },
}

export function InsightCard({
  title,
  description,
  icon: Icon,
  color = 'blue',
  className,
}: InsightCardProps) {
  const colors = colorClasses[color]

  return (
    <Card className={cn(colors.card, className)}>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', colors.icon)}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h3 className={cn('font-semibold text-base', colors.title)}>{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
