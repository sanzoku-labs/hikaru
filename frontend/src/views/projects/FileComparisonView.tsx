import { cn } from '@/lib/utils'
import { formatFileSize } from '@/lib/utils'
import {
  GitCompare,
  FileSpreadsheet,
  ArrowRight,
  Sparkles,
  Play,
  RotateCcw,
  TrendingUp,
  Calendar,
  Columns,
  Save,
} from 'lucide-react'
import { PageHeaderView, EmptyStateView, LoadingSpinnerView, ErrorAlertView } from '@/views/shared'
import { GlobalSummaryView } from '@/views/analysis'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { OverlayChartView } from '@/views/charts/OverlayChartView'
import { SaveDashboardDialog } from '@/views/dashboards'
import type {
  ProjectFileResponse,
  ComparisonResponse,
} from '@/types/api'
import type { ComparisonType } from '@/hooks/projects/useFileComparisonFlow'

interface FileComparisonViewProps {
  // Project data
  projectName: string
  files: ProjectFileResponse[]
  isLoading: boolean
  fetchError: string | null

  // Selection state
  selectedFileA: ProjectFileResponse | null
  selectedFileB: ProjectFileResponse | null
  comparisonType: ComparisonType

  // Comparison result
  comparisonResult: ComparisonResponse | null
  isComparing: boolean
  comparisonError: string | null

  // Handlers
  onSelectFileA: (fileId: number) => void
  onSelectFileB: (fileId: number) => void
  onComparisonTypeChange: (type: ComparisonType) => void
  onCompare: () => void
  onReset: () => void
  onBackClick: () => void

  // Validation
  canCompare: boolean

  // Save as Dashboard
  showSaveDialog: boolean
  isSavingDashboard: boolean
  onOpenSaveDialog: () => void
  onCloseSaveDialog: () => void
  onSaveDashboard: (name: string) => void
}

const comparisonTypes: { value: ComparisonType; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: 'side_by_side',
    label: 'Side by Side',
    icon: <Columns className="h-4 w-4" />,
    description: 'Compare matching columns between files',
  },
  {
    value: 'trend',
    label: 'Trend Analysis',
    icon: <TrendingUp className="h-4 w-4" />,
    description: 'Analyze trends over time',
  },
  {
    value: 'yoy',
    label: 'Year over Year',
    icon: <Calendar className="h-4 w-4" />,
    description: 'Compare data across years',
  },
]

export function FileComparisonView({
  projectName,
  files,
  isLoading,
  fetchError,
  selectedFileA,
  selectedFileB,
  comparisonType,
  comparisonResult,
  isComparing,
  comparisonError,
  onSelectFileA,
  onSelectFileB,
  onComparisonTypeChange,
  onCompare,
  onReset,
  onBackClick,
  canCompare,
  // Save as Dashboard
  showSaveDialog,
  isSavingDashboard,
  onOpenSaveDialog,
  onCloseSaveDialog,
  onSaveDashboard,
}: FileComparisonViewProps) {
  const hasResult = !!comparisonResult

  if (isLoading) {
    return (
      <div className="py-20">
        <LoadingSpinnerView size="lg" label="Loading project..." />
      </div>
    )
  }

  if (fetchError) {
    return (
      <ErrorAlertView
        title="Failed to load project"
        message={fetchError}
        onRetry={onBackClick}
      />
    )
  }

  if (files.length < 2) {
    return (
      <div className="py-20">
        <EmptyStateView
          icon={<GitCompare className="h-12 w-12" />}
          title="Not enough files"
          description="You need at least 2 files in this project to compare them."
          action={{ label: 'Go Back', onClick: onBackClick }}
        />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <PageHeaderView
        title="Compare Files"
        description={`Select two files from ${projectName} to compare`}
        backButton={{ label: 'Back to Project', onClick: onBackClick }}
        compact
        actions={
          hasResult ? (
            <button
              onClick={onReset}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
                'bg-secondary text-secondary-foreground font-medium text-sm',
                'transition-colors hover:bg-secondary/80'
              )}
            >
              <RotateCcw className="h-4 w-4" />
              New Comparison
            </button>
          ) : null
        }
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* File Selection Section */}
        {!hasResult && (
          <div className="space-y-6 pb-8">
            {/* Selection Cards */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <GitCompare className="h-5 w-5 text-primary" />
                  Select Files to Compare
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* File Selection Row */}
                <div className="flex items-center gap-4">
                  {/* File A */}
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="file-a">First File</Label>
                    <Select
                      value={selectedFileA?.id?.toString() || ''}
                      onValueChange={(val) => onSelectFileA(Number(val))}
                    >
                      <SelectTrigger id="file-a" className="w-full">
                        <SelectValue placeholder="Select first file..." />
                      </SelectTrigger>
                      <SelectContent>
                        {files.map((file) => (
                          <SelectItem
                            key={file.id}
                            value={file.id.toString()}
                            disabled={file.id === selectedFileB?.id}
                          >
                            <div className="flex items-center gap-2">
                              <FileSpreadsheet className="h-4 w-4" />
                              <span>{file.filename}</span>
                              <span className="text-muted-foreground text-xs">
                                ({formatFileSize(file.file_size)})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedFileA && (
                      <p className="text-xs text-muted-foreground">
                        {selectedFileA.data_schema?.row_count?.toLocaleString() || '?'} rows ·{' '}
                        {selectedFileA.data_schema?.columns?.length || '?'} columns
                      </p>
                    )}
                  </div>

                  {/* Arrow */}
                  <div className="flex-shrink-0 pt-6">
                    <div className="p-2 rounded-full bg-muted">
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>

                  {/* File B */}
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="file-b">Second File</Label>
                    <Select
                      value={selectedFileB?.id?.toString() || ''}
                      onValueChange={(val) => onSelectFileB(Number(val))}
                    >
                      <SelectTrigger id="file-b" className="w-full">
                        <SelectValue placeholder="Select second file..." />
                      </SelectTrigger>
                      <SelectContent>
                        {files.map((file) => (
                          <SelectItem
                            key={file.id}
                            value={file.id.toString()}
                            disabled={file.id === selectedFileA?.id}
                          >
                            <div className="flex items-center gap-2">
                              <FileSpreadsheet className="h-4 w-4" />
                              <span>{file.filename}</span>
                              <span className="text-muted-foreground text-xs">
                                ({formatFileSize(file.file_size)})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedFileB && (
                      <p className="text-xs text-muted-foreground">
                        {selectedFileB.data_schema?.row_count?.toLocaleString() || '?'} rows ·{' '}
                        {selectedFileB.data_schema?.columns?.length || '?'} columns
                      </p>
                    )}
                  </div>
                </div>

                {/* Comparison Type Selection */}
                <div className="space-y-3">
                  <Label>Comparison Type</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {comparisonTypes.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => onComparisonTypeChange(type.value)}
                        className={cn(
                          'flex flex-col items-center gap-2 p-4 rounded-lg border transition-all',
                          comparisonType === type.value
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {type.icon}
                        <span className="font-medium text-sm">{type.label}</span>
                        <span className="text-xs text-center opacity-70">
                          {type.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Compare Button */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={onCompare}
                    disabled={!canCompare || isComparing}
                    className={cn(
                      'inline-flex items-center gap-2 px-6 py-3 rounded-lg',
                      'bg-primary text-primary-foreground font-medium',
                      'transition-all duration-200',
                      'hover:bg-primary/90',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    {isComparing ? (
                      <>
                        <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Comparing...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Compare Files
                      </>
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Error */}
            {comparisonError && (
              <ErrorAlertView
                title="Comparison failed"
                message={comparisonError}
                onRetry={onCompare}
              />
            )}
          </div>
        )}

        {/* Comparison Results */}
        {hasResult && (
          <div className="space-y-6 pb-8">
            {/* Files Being Compared */}
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
                    <FileSpreadsheet className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-sm">
                      {comparisonResult.file_a.filename}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GitCompare className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {comparisonResult.comparison_type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
                    <FileSpreadsheet className="h-4 w-4 text-purple-500" />
                    <span className="font-medium text-sm">
                      {comparisonResult.file_b.filename}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Summary */}
            {comparisonResult.summary_insight && (
              <GlobalSummaryView summary={comparisonResult.summary_insight} />
            )}

            {/* Overlay Charts */}
            {comparisonResult.overlay_charts.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">
                      Comparison Charts
                    </h3>
                    <span className="text-sm text-muted-foreground">
                      ({comparisonResult.overlay_charts.length} charts)
                    </span>
                  </div>
                  <button
                    onClick={onOpenSaveDialog}
                    className={cn(
                      'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
                      'bg-secondary text-secondary-foreground font-medium text-sm',
                      'transition-colors hover:bg-secondary/80'
                    )}
                  >
                    <Save className="h-4 w-4" />
                    Save as Dashboard
                  </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {comparisonResult.overlay_charts.map((chart, index) => (
                    <OverlayChartView
                      key={index}
                      chart={chart}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* No charts */}
            {comparisonResult.overlay_charts.length === 0 && (
              <EmptyStateView
                icon={<GitCompare className="h-10 w-10" />}
                title="No comparable data found"
                description="The selected files don't have compatible columns for comparison."
              />
            )}
          </div>
        )}
      </div>

      {/* Save Dashboard Dialog */}
      {comparisonResult && (
        <SaveDashboardDialog
          open={showSaveDialog}
          onOpenChange={(open) => !open && onCloseSaveDialog()}
          onSave={onSaveDashboard}
          isSaving={isSavingDashboard}
          defaultName={`${comparisonResult.file_a.filename} vs ${comparisonResult.file_b.filename}`}
          dashboardType="comparison"
        />
      )}
    </div>
  )
}
