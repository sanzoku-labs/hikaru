import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import {
  FolderOpen,
  FileSpreadsheet,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Sparkles,
  PieChart,
  LineChart,
  ScatterChart,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { PageHeaderView, LoadingSpinnerView, ErrorAlertView, EmptyStateView } from '@/views/shared'
import { EmptyAnalyticsSpot } from '@/components/illustrations'
import type { AnalyticsResponse, RecentAnalysis, TopInsight } from '@/types/api'

interface AnalyticsViewProps {
  data: AnalyticsResponse | undefined
  isLoading: boolean
  error: string | null
  onRetry: () => void
}

interface StatCardProps {
  title: string
  value: number
  trend: number
  icon: React.ReactNode
  trendLabel?: string
}

function StatCard({ title, value, trend, icon, trendLabel = 'vs last period' }: StatCardProps) {
  const isPositive = trend >= 0
  const TrendIcon = isPositive ? TrendingUp : TrendingDown

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">{value.toLocaleString()}</div>
        <div className="flex items-center gap-1 mt-2 text-sm">
          <TrendIcon
            className={cn(
              'h-4 w-4',
              isPositive ? 'text-green-500' : 'text-red-500'
            )}
          />
          <span
            className={cn(
              'font-medium',
              isPositive ? 'text-green-500' : 'text-red-500'
            )}
          >
            {isPositive ? '+' : ''}{trend.toFixed(1)}%
          </span>
          <span className="text-muted-foreground">{trendLabel}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function RecentAnalysisItem({ analysis }: { analysis: RecentAnalysis }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="p-2 rounded-lg bg-muted">
        <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{analysis.filename}</p>
        <p className="text-xs text-muted-foreground">
          {analysis.project_name} · {analysis.charts_count} charts
        </p>
      </div>
      <span className="text-xs text-muted-foreground">
        {formatDate(analysis.analyzed_at)}
      </span>
    </div>
  )
}

function InsightItem({ insight }: { insight: TopInsight }) {
  return (
    <div className="p-4 rounded-lg border bg-card">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
          <Lightbulb className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium mb-1">{insight.filename}</p>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {insight.insight}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {insight.project_name} · {formatDate(insight.analyzed_at)}
          </p>
        </div>
      </div>
    </div>
  )
}

function ChartDistributionBar({ distribution }: { distribution: AnalyticsResponse['chart_type_distribution'] }) {
  const total = distribution.line + distribution.bar + distribution.pie + distribution.scatter
  if (total === 0) return null

  const items = [
    { type: 'Line', count: distribution.line, color: 'bg-blue-500', icon: LineChart },
    { type: 'Bar', count: distribution.bar, color: 'bg-purple-500', icon: BarChart3 },
    { type: 'Pie', count: distribution.pie, color: 'bg-pink-500', icon: PieChart },
    { type: 'Scatter', count: distribution.scatter, color: 'bg-orange-500', icon: ScatterChart },
  ].filter(item => item.count > 0)

  return (
    <div className="space-y-4">
      {/* Bar visualization */}
      <div className="h-3 rounded-full overflow-hidden flex bg-muted">
        {items.map(item => (
          <div
            key={item.type}
            className={cn('h-full transition-all', item.color)}
            style={{ width: `${(item.count / total) * 100}%` }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-3">
        {items.map(item => {
          const Icon = item.icon
          const percent = ((item.count / total) * 100).toFixed(0)
          return (
            <div key={item.type} className="flex items-center gap-2">
              <div className={cn('w-3 h-3 rounded-sm', item.color)} />
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{item.type}</span>
              <span className="text-sm text-muted-foreground">
                {item.count} ({percent}%)
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function AnalyticsView({ data, isLoading, error, onRetry }: AnalyticsViewProps) {
  if (isLoading) {
    return (
      <div className="py-20">
        <LoadingSpinnerView size="lg" label="Loading analytics..." />
      </div>
    )
  }

  if (error) {
    return (
      <ErrorAlertView
        title="Failed to load analytics"
        message={error}
        onRetry={onRetry}
      />
    )
  }

  if (!data) {
    return (
      <EmptyStateView
        illustration={<EmptyAnalyticsSpot />}
        icon={<BarChart3 className="h-12 w-12" />}
        title="No analytics data"
        description="Start analyzing files to see your analytics."
      />
    )
  }

  const hasNoData = data.total_projects === 0 && data.total_files === 0

  return (
    <div className="space-y-6">
      <PageHeaderView
        title="Analytics"
        description="Overview of your data analysis activity"
        compact
      />

      {hasNoData ? (
        <EmptyStateView
          illustration={<EmptyAnalyticsSpot />}
          icon={<BarChart3 className="h-12 w-12" />}
          title="No data yet"
          description="Create a project and analyze some files to see your analytics."
        />
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Total Projects"
              value={data.total_projects}
              trend={data.projects_trend}
              icon={<FolderOpen className="h-4 w-4" />}
            />
            <StatCard
              title="Total Files"
              value={data.total_files}
              trend={data.files_trend}
              icon={<FileSpreadsheet className="h-4 w-4" />}
            />
            <StatCard
              title="Total Analyses"
              value={data.total_analyses}
              trend={data.analyses_trend}
              icon={<BarChart3 className="h-4 w-4" />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Chart Distribution
                </CardTitle>
                <CardDescription>Types of charts generated</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartDistributionBar distribution={data.chart_type_distribution} />
              </CardContent>
            </Card>

            {/* Recent Analyses */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                  Recent Analyses
                </CardTitle>
                <CardDescription>Latest file analyses</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {data.recent_analyses.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    No recent analyses
                  </div>
                ) : (
                  <div className="divide-y">
                    {data.recent_analyses.slice(0, 5).map((analysis, idx) => (
                      <RecentAnalysisItem key={idx} analysis={analysis} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Insights */}
          {data.top_insights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  Top Insights
                </CardTitle>
                <CardDescription>Key findings from your analyses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.top_insights.slice(0, 4).map((insight, idx) => (
                    <InsightItem key={idx} insight={insight} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
