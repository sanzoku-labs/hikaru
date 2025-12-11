import { cn } from '@/lib/utils'
import { formatFileSize } from '@/lib/utils'
import { FileSpreadsheet, Sparkles, Play, RotateCcw, X } from 'lucide-react'
import { PageHeaderView, LoadingSpinnerView, ErrorAlertView } from '@/views/shared'
import { GlobalSummaryView, DataSummaryView } from '@/views/analysis'
import { ChartGridView } from '@/views/charts'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { ProjectFileResponse, FileAnalysisResponse } from '@/types/api'

interface ProjectFileAnalysisViewProps {
  // Data
  file: ProjectFileResponse | null
  projectName: string
  analysisData: FileAnalysisResponse | null
  isLoading: boolean
  fetchError: string | null

  // Re-analyze form state
  showReanalyzeForm: boolean
  userIntent: string

  // Handlers
  onAnalyze: () => void
  onUserIntentChange: (intent: string) => void
  onToggleReanalyze: () => void
  onBackClick: () => void

  // Status
  isAnalyzing: boolean
  analysisError: string | null
}

export function ProjectFileAnalysisView({
  file,
  projectName,
  analysisData,
  isLoading,
  fetchError,
  showReanalyzeForm,
  userIntent,
  onAnalyze,
  onUserIntentChange,
  onToggleReanalyze,
  onBackClick,
  isAnalyzing,
  analysisError,
}: ProjectFileAnalysisViewProps) {
  if (isLoading) {
    return (
      <div className="py-20">
        <LoadingSpinnerView size="lg" label="Loading file..." />
      </div>
    )
  }

  if (fetchError || !file) {
    return (
      <div className="max-w-6xl mx-auto">
        <ErrorAlertView
          title="Failed to load file"
          message={fetchError || 'File not found'}
          onRetry={onBackClick}
        />
      </div>
    )
  }

  const hasAnalysis = !!analysisData

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <PageHeaderView
        title={file.filename}
        description={`${formatFileSize(file.file_size)} · ${file.data_schema?.row_count?.toLocaleString() || '?'} rows`}
        backButton={{ label: `Back to ${projectName}`, onClick: onBackClick }}
        actions={
          <div className="flex items-center gap-2">
            {hasAnalysis && (
              <button
                onClick={onToggleReanalyze}
                disabled={isAnalyzing}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
                  'bg-secondary text-secondary-foreground font-medium text-sm',
                  'transition-colors hover:bg-secondary/80',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {showReanalyzeForm ? (
                  <>
                    <X className="h-4 w-4" />
                    Cancel
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4" />
                    Re-analyze
                  </>
                )}
              </button>
            )}
            {!hasAnalysis && (
              <button
                onClick={() => onAnalyze()}
                disabled={isAnalyzing}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
                  'bg-primary text-primary-foreground font-medium text-sm',
                  'transition-all duration-200',
                  'hover:bg-primary/90 hover:glow-primary-sm',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {isAnalyzing ? (
                  <>
                    <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Analyze File
                  </>
                )}
              </button>
            )}
          </div>
        }
      />

      {/* Re-analyze form */}
      {showReanalyzeForm && (
        <div className="mb-6 p-6 rounded-xl border bg-card animate-in-up">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reanalyze-intent" className="text-sm font-medium">
                What would you like to learn from this data?
                <span className="text-muted-foreground font-normal ml-1">(optional)</span>
              </Label>
              <Textarea
                id="reanalyze-intent"
                placeholder="e.g., Focus on trends over time, or Compare categories..."
                value={userIntent}
                onChange={(e) => onUserIntentChange(e.target.value)}
                className="min-h-[80px] resize-none"
              />
            </div>
            <button
              onClick={() => onAnalyze()}
              disabled={isAnalyzing}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
                'bg-primary text-primary-foreground font-medium text-sm',
                'transition-all duration-200',
                'hover:bg-primary/90',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isAnalyzing ? (
                <>
                  <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Run Analysis
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Analysis error */}
      {analysisError && (
        <ErrorAlertView
          title="Analysis failed"
          message={analysisError}
          onRetry={() => onAnalyze()}
          className="mb-6"
        />
      )}

      {/* Analyzing state */}
      {isAnalyzing && !showReanalyzeForm && (
        <div className="py-12">
          <LoadingSpinnerView size="lg" label="Analyzing your data and generating insights..." />
        </div>
      )}

      {/* No analysis yet */}
      {!hasAnalysis && !isAnalyzing && (
        <div className="py-12 text-center">
          <div className="inline-flex p-4 rounded-2xl bg-muted/50 text-muted-foreground mb-4">
            <FileSpreadsheet className="h-12 w-12" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Ready to analyze
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Click the "Analyze File" button to generate charts and AI-powered insights from your data.
          </p>
        </div>
      )}

      {/* Analysis results */}
      {hasAnalysis && !showReanalyzeForm && (
        <div className="space-y-8 pb-8">
          {/* Global AI Summary */}
          {analysisData.global_summary && (
            <GlobalSummaryView summary={analysisData.global_summary} />
          )}

          {/* Data summary (collapsed by default) */}
          {file.data_schema && (
            <DataSummaryView
              fileName={file.filename}
              dataSchema={file.data_schema}
            />
          )}

          {/* Charts grid */}
          {analysisData.charts && analysisData.charts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">
                  Generated Charts
                </h3>
                <span className="text-sm text-muted-foreground">
                  ({analysisData.charts.length} charts)
                </span>
              </div>
              <ChartGridView charts={analysisData.charts} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
