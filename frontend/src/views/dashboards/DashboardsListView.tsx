import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import {
  LayoutDashboard,
  FileSpreadsheet,
  GitCompare,
  Merge,
  Trash2,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinnerView, EmptyStateView } from '@/views/shared'
import type { DashboardResponse } from '@/types/api'

interface DashboardsListViewProps {
  dashboards: DashboardResponse[]
  isLoading: boolean
  onView: (dashboardId: number) => void
  onDelete: (dashboardId: number) => void
  isDeleting?: number | null
}

const dashboardTypeConfig = {
  single_file: {
    icon: FileSpreadsheet,
    label: 'Single File',
    color: 'text-blue-500 bg-blue-500/10',
  },
  comparison: {
    icon: GitCompare,
    label: 'Comparison',
    color: 'text-purple-500 bg-purple-500/10',
  },
  merged: {
    icon: Merge,
    label: 'Merged',
    color: 'text-green-500 bg-green-500/10',
  },
}

function DashboardCard({
  dashboard,
  onView,
  onDelete,
  isDeleting,
}: {
  dashboard: DashboardResponse
  onView: () => void
  onDelete: () => void
  isDeleting: boolean
}) {
  const config = dashboardTypeConfig[dashboard.dashboard_type as keyof typeof dashboardTypeConfig]
    || dashboardTypeConfig.single_file
  const Icon = config.icon

  // Parse config to get chart count
  let chartCount = 0
  try {
    const configData = JSON.parse(dashboard.config_json || '{}')
    chartCount = configData.charts?.length || 0
  } catch {
    // Ignore parse errors
  }

  return (
    <Card className="group cursor-pointer transition-all duration-200 hover:border-primary/30 hover:shadow-[0_8px_30px_-8px_hsl(var(--primary)/0.12)]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', config.color)}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">{dashboard.name}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {config.label} · {chartCount} chart{chartCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              onClick={onView}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="View dashboard"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              disabled={isDeleting}
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title="Delete dashboard"
            >
              {isDeleting ? (
                <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin block" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-muted-foreground">
          Created {formatDate(dashboard.created_at)}
          {dashboard.updated_at !== dashboard.created_at && (
            <> · Updated {formatDate(dashboard.updated_at)}</>
          )}
        </p>
      </CardContent>
    </Card>
  )
}

export function DashboardsListView({
  dashboards,
  isLoading,
  onView,
  onDelete,
  isDeleting,
}: DashboardsListViewProps) {
  if (isLoading) {
    return (
      <div className="py-20">
        <LoadingSpinnerView size="lg" label="Loading dashboards..." />
      </div>
    )
  }

  if (dashboards.length === 0) {
    return (
      <EmptyStateView
        icon={<LayoutDashboard className="h-10 w-10" />}
        title="No dashboards yet"
        description="Save an analysis as a dashboard to view it here."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {dashboards.map((dashboard) => (
        <DashboardCard
          key={dashboard.id}
          dashboard={dashboard}
          onView={() => onView(dashboard.id)}
          onDelete={() => onDelete(dashboard.id)}
          isDeleting={isDeleting === dashboard.id}
        />
      ))}
    </div>
  )
}
