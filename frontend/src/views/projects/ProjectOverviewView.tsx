import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { formatFileSize, formatDate } from '@/lib/utils'
import {
  FileSpreadsheet,
  Database,
  Columns,
  CheckCircle2,
  Clock,
  TrendingUp,
  BarChart3,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { EmptyStateView } from '@/views/shared'
import { EmptyFilesSpot } from '@/components/illustrations'
import type { ProjectFileResponse } from '@/types/api'

interface ProjectOverviewViewProps {
  files: ProjectFileResponse[]
  projectName: string
  projectDescription?: string
  createdAt: string
}

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: React.ReactNode
  trend?: { value: number; label: string }
  className?: string
}

function StatCard({ title, value, description, icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-2 text-xs">
            <TrendingUp className="h-3 w-3 text-green-500" />
            <span className="text-green-500 font-medium">+{trend.value}%</span>
            <span className="text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function ProjectOverviewView({
  files,
  projectName,
  projectDescription,
  createdAt,
}: ProjectOverviewViewProps) {
  // Compute aggregated statistics
  const stats = useMemo(() => {
    const totalFiles = files.length
    const totalRows = files.reduce(
      (sum, file) => sum + (file.data_schema?.row_count || 0),
      0
    )
    const totalSize = files.reduce((sum, file) => sum + file.file_size, 0)

    // Count unique columns across all files
    const allColumns = new Set<string>()
    files.forEach((file) => {
      file.data_schema?.columns?.forEach((col) => allColumns.add(col.name))
    })
    const totalColumns = allColumns.size

    // Analyzed files count
    const analyzedFiles = files.filter((f) => f.has_analysis).length
    const analyzedPercent = totalFiles > 0
      ? Math.round((analyzedFiles / totalFiles) * 100)
      : 0

    // Recent uploads (last 7 days)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const recentUploads = files.filter(
      (f) => new Date(f.uploaded_at).getTime() > sevenDaysAgo
    ).length

    // File type distribution
    const fileTypes: Record<string, number> = {}
    files.forEach((file) => {
      const ext = file.filename.split('.').pop()?.toLowerCase() || 'unknown'
      fileTypes[ext] = (fileTypes[ext] || 0) + 1
    })

    // Largest file
    const largestFile = files.reduce(
      (max, file) => (file.file_size > (max?.file_size || 0) ? file : max),
      files[0]
    )

    // Most recent upload
    const mostRecentFile = files.reduce(
      (latest, file) =>
        new Date(file.uploaded_at) > new Date(latest?.uploaded_at || 0)
          ? file
          : latest,
      files[0]
    )

    return {
      totalFiles,
      totalRows,
      totalSize,
      totalColumns,
      analyzedFiles,
      analyzedPercent,
      recentUploads,
      fileTypes,
      largestFile,
      mostRecentFile,
    }
  }, [files])

  if (files.length === 0) {
    return (
      <EmptyStateView
        illustration={<EmptyFilesSpot />}
        icon={<FileSpreadsheet className="h-12 w-12" />}
        title="No files yet"
        description="Upload files to this project to see aggregated statistics and insights."
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Project Info */}
      <div className="pb-4 border-b border-border">
        <h2 className="text-xl font-semibold">{projectName}</h2>
        {projectDescription && (
          <p className="text-muted-foreground mt-1">{projectDescription}</p>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          Created {formatDate(createdAt)}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Files"
          value={stats.totalFiles}
          description={`${stats.recentUploads} uploaded this week`}
          icon={<FileSpreadsheet className="h-4 w-4" />}
        />
        <StatCard
          title="Total Rows"
          value={stats.totalRows.toLocaleString()}
          description="Across all files"
          icon={<Database className="h-4 w-4" />}
        />
        <StatCard
          title="Unique Columns"
          value={stats.totalColumns}
          description="Distinct column names"
          icon={<Columns className="h-4 w-4" />}
        />
        <StatCard
          title="Analysis Coverage"
          value={`${stats.analyzedPercent}%`}
          description={`${stats.analyzedFiles} of ${stats.totalFiles} files analyzed`}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
      </div>

      {/* Details Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* File Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              File Types
            </CardTitle>
            <CardDescription>Distribution by file format</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.fileTypes).map(([type, count]) => {
                const percent = Math.round((count / stats.totalFiles) * 100)
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium uppercase">.{type}</span>
                      <span className="text-muted-foreground">
                        {count} file{count !== 1 ? 's' : ''} ({percent}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest file uploads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {files
                .sort(
                  (a, b) =>
                    new Date(b.uploaded_at).getTime() -
                    new Date(a.uploaded_at).getTime()
                )
                .slice(0, 5)
                .map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="p-1.5 rounded bg-muted">
                      <FileSpreadsheet className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {file.filename}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.file_size)} ·{' '}
                        {file.data_schema?.row_count?.toLocaleString() || '?'} rows
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {file.has_analysis && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDate(file.uploaded_at)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats Footer */}
      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <div className="flex items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Total Storage:</span>
              <span className="font-medium">{formatFileSize(stats.totalSize)}</span>
            </div>
            {stats.largestFile && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Largest File:</span>
                <span className="font-medium">{stats.largestFile.filename}</span>
                <span className="text-muted-foreground">
                  ({formatFileSize(stats.largestFile.file_size)})
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
