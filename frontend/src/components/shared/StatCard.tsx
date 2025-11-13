/**
 * StatCard - KPI metric card matching Mockup 1 & 3
 *
 * Features:
 * - Icon with colored background
 * - Metric value with trend indicator
 * - Label and optional description
 * - Optional trend percentage with up/down arrow
 * - Hover effects
 */

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StatCardProps {
  label: string
  value: string | number
  description?: string
  icon: React.ElementType
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
  }
  iconColor?: string
  iconBgColor?: string
  className?: string
}

export function StatCard({
  label,
  value,
  description,
  icon: Icon,
  trend,
  iconColor = 'text-primary',
  iconBgColor = 'bg-primary/10',
  className
}: StatCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null

    switch (trend.direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />
      case 'down':
        return <TrendingDown className="h-4 w-4" />
      case 'neutral':
        return <Minus className="h-4 w-4" />
    }
  }

  const getTrendColor = () => {
    if (!trend) return ''

    switch (trend.direction) {
      case 'up':
        return 'text-success'
      case 'down':
        return 'text-error'
      case 'neutral':
        return 'text-muted-foreground'
    }
  }

  return (
    <Card className={cn('hover:shadow-card-hover transition-shadow', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          {/* Left: Icon and Content */}
          <div className="flex-1">
            <div className={cn('inline-flex p-3 rounded-lg mb-4', iconBgColor)}>
              <Icon className={cn('h-6 w-6', iconColor)} />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <p className="text-3xl font-bold text-foreground">{value}</p>
              {description && (
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              )}
            </div>
          </div>

          {/* Right: Trend Indicator */}
          {trend && (
            <div className={cn('flex items-center gap-1 text-sm font-medium', getTrendColor())}>
              {getTrendIcon()}
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
