import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import {
  LayoutDashboard,
  FileSpreadsheet,
  GitCompare,
  Merge,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeaderView, LoadingSpinnerView, ErrorAlertView } from '@/views/shared'
import { GlobalSummaryView } from '@/views/analysis'
import { ChartGridView } from '@/views/charts'
import type { DashboardResponse, ChartData } from '@/types/api'

interface DashboardDetailViewProps {
  dashboard: DashboardResponse | undefined
  isLoading: boolean
  error: string | null
  onBack: () => void
}

interface ParsedConfig {
  file_ids?: number[]
  charts?: ChartData[]
  global_summary?: string
}

const dashboardTypeConfig = {
  single_file: {
    icon: FileSpreadsheet,
    label: 'Single File Analysis',
    color: 'text-blue-500',
  },
  comparison: {
    icon: GitCompare,
    label: 'File Comparison',
    color: 'text-purple-500',
  },
  merged: {
    icon: Merge,
    label: 'Merged Analysis',
    color: 'text-green-500',
  },
}

export function DashboardDetailView({
  dashboard,
  isLoading,
  error,
  onBack,
}: DashboardDetailViewProps) {
  // Parse the config JSON
  const parsedData = useMemo(() => {
    if (!dashboard) return { charts: [], globalSummary: null }

    let charts: ChartData[] = []
    let globalSummary: string | null = null

    // Try parsing config_json
    try {
      const config: ParsedConfig = JSON.parse(dashboard.config_json || '{}')
      charts = config.charts || []
      globalSummary = config.global_summary || null
    } catch {
      // config_json parse failed
    }

    // If no charts in config, try chart_data
    if (charts.length === 0 && dashboard.chart_data) {
      try {
        const chartData = JSON.parse(dashboard.chart_data)
        if (Array.isArray(chartData)) {
          charts = chartData
        } else if (chartData.charts) {
          charts = chartData.charts
          globalSummary = chartData.global_summary || globalSummary
        }
      } catch {
        // chart_data parse failed
      }
    }

    return { charts, globalSummary }
  }, [dashboard])

  if (isLoading) {
    return (
      <div className="py-20">
        <LoadingSpinnerView size="lg" label="Loading dashboard..." />
      </div>
    )
  }

  if (error) {
    return (
      <ErrorAlertView
        title="Failed to load dashboard"
        message={error}
        onRetry={onBack}
      />
    )
  }

  if (!dashboard) {
    return (
      <ErrorAlertView
        title="Dashboard not found"
        message="The requested dashboard could not be found."
        onRetry={onBack}
      />
    )
  }

  const typeConfig = dashboardTypeConfig[dashboard.dashboard_type as keyof typeof dashboardTypeConfig]
    || dashboardTypeConfig.single_file
  const TypeIcon = typeConfig.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeaderView
        title={dashboard.name}
        description={`${typeConfig.label} · Created ${formatDate(dashboard.created_at)}`}
        backButton={{ label: 'Back', onClick: onBack }}
        compact
      />

      {/* Dashboard Type Badge */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-center gap-3">
            <div className={cn('p-2 rounded-lg bg-muted', typeConfig.color)}>
              <TypeIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">{typeConfig.label}</p>
              <p className="text-sm text-muted-foreground">
                {parsedData.charts.length} chart{parsedData.charts.length !== 1 ? 's' : ''} saved
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Global Summary */}
      {parsedData.globalSummary && (
        <GlobalSummaryView summary={parsedData.globalSummary} />
      )}

      {/* Charts */}
      {parsedData.charts.length > 0 ? (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              Saved Charts
            </h3>
            <span className="text-sm text-muted-foreground">
              ({parsedData.charts.length} charts)
            </span>
          </div>
          <ChartGridView charts={parsedData.charts} />
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <LayoutDashboard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No charts saved in this dashboard.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
