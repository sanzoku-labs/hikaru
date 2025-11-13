/**
 * InsightsPanel - AI insights display panel (Mockup 6)
 *
 * Features:
 * - Global insights summary
 * - Per-chart insights with confidence scores
 * - Follow-up questions suggestions
 * - Expandable/collapsible sections
 * - Loading states with skeletons
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Lightbulb, TrendingUp, AlertCircle, CheckCircle2, ChevronDown, ChevronRight, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChartInsight {
  chart_id: string
  chart_title: string
  insight: string
  confidence: number // 0-100
  key_findings: string[]
}

interface GlobalInsight {
  summary: string
  confidence: number
  key_patterns: string[]
  recommendations?: string[]
}

interface FollowUpQuestion {
  id: string
  question: string
  category: 'trend' | 'comparison' | 'detail' | 'prediction'
}

export interface InsightsPanelProps {
  globalInsight?: GlobalInsight
  chartInsights?: ChartInsight[]
  followUpQuestions?: FollowUpQuestion[]
  loading?: boolean
  onAskQuestion?: (question: string) => void
  className?: string
}

const getConfidenceBadge = (confidence: number) => {
  if (confidence >= 85) {
    return (
      <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        High Confidence
      </Badge>
    )
  } else if (confidence >= 70) {
    return (
      <Badge variant="secondary" className="bg-info/10 text-info border-info/20">
        <TrendingUp className="h-3 w-3 mr-1" />
        Moderate
      </Badge>
    )
  } else {
    return (
      <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">
        <AlertCircle className="h-3 w-3 mr-1" />
        Low Confidence
      </Badge>
    )
  }
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'trend':
      return 'bg-chart-blue/10 text-chart-blue border-chart-blue/20'
    case 'comparison':
      return 'bg-chart-purple/10 text-chart-purple border-chart-purple/20'
    case 'detail':
      return 'bg-chart-green/10 text-chart-green border-chart-green/20'
    case 'prediction':
      return 'bg-chart-orange/10 text-chart-orange border-chart-orange/20'
    default:
      return 'bg-muted'
  }
}

export function InsightsPanel({
  globalInsight,
  chartInsights = [],
  followUpQuestions = [],
  loading = false,
  onAskQuestion,
  className
}: InsightsPanelProps) {
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set(['global']))

  const toggleInsight = (id: string) => {
    setExpandedInsights((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Global Insights */}
      {globalInsight && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-1">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Lightbulb className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">Key Insights</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    AI-generated summary of your data
                  </CardDescription>
                </div>
              </div>
              {getConfidenceBadge(globalInsight.confidence)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed">{globalInsight.summary}</p>

            {globalInsight.key_patterns && globalInsight.key_patterns.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Key Patterns:</p>
                <ul className="space-y-2">
                  {globalInsight.key_patterns.map((pattern, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>{pattern}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {globalInsight.recommendations && globalInsight.recommendations.length > 0 && (
              <div className="pt-3 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-2">Recommendations:</p>
                <ul className="space-y-2">
                  {globalInsight.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <TrendingUp className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Chart-Specific Insights */}
      {chartInsights.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground px-1">Chart Insights</h3>
          {chartInsights.map((chartInsight) => {
            const isExpanded = expandedInsights.has(chartInsight.chart_id)

            return (
              <Card key={chartInsight.chart_id}>
                <CardHeader className="pb-3">
                  <button
                    onClick={() => toggleInsight(chartInsight.chart_id)}
                    className="flex items-start justify-between gap-2 w-full text-left group"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <CardTitle className="text-sm truncate group-hover:text-primary transition-colors">
                        {chartInsight.chart_title}
                      </CardTitle>
                    </div>
                    {getConfidenceBadge(chartInsight.confidence)}
                  </button>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-3 pt-0">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {chartInsight.insight}
                    </p>

                    {chartInsight.key_findings && chartInsight.key_findings.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Key Findings:</p>
                        <ul className="space-y-1.5">
                          {chartInsight.key_findings.map((finding, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs">
                              <span className="text-primary flex-shrink-0 mt-0.5">•</span>
                              <span>{finding}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Follow-up Questions */}
      {followUpQuestions.length > 0 && onAskQuestion && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Follow-up Questions</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Ask these questions to learn more about your data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {followUpQuestions.map((fq) => (
                <Button
                  key={fq.id}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left h-auto py-2.5 px-3"
                  onClick={() => onAskQuestion(fq.question)}
                >
                  <div className="flex items-start gap-2 flex-1">
                    <Badge
                      variant="secondary"
                      className={cn('text-xs flex-shrink-0', getCategoryColor(fq.category))}
                    >
                      {fq.category}
                    </Badge>
                    <span className="text-sm flex-1">{fq.question}</span>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
