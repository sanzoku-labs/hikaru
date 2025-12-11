import { cn } from '@/lib/utils'
import { formatFileSize } from '@/lib/utils'
import { FileSpreadsheet, Sparkles, Play } from 'lucide-react'
import { PageHeaderView, LoadingSpinnerView, ErrorAlertView } from '@/views/shared'
import { GlobalSummaryView, DataPreviewView } from '@/views/analysis'
import { ChartGridView } from '@/views/charts'
import type { ProjectFileResponse, FileAnalysisResponse } from '@/types/api'

interface ProjectFileAnalysisViewProps {
  // Data
  file: ProjectFileResponse | null
  projectName: string
  analysisData: FileAnalysisResponse | null
  isLoading: boolean
  fetchError: string | null

  // Handlers
  onAnalyze: () => void
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
  onAnalyze,
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
          !hasAnalysis && (
            <button
              onClick={onAnalyze}
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
          )
        }
      />

      {/* Analysis error */}
      {analysisError && (
        <ErrorAlertView
          title="Analysis failed"
          message={analysisError}
          onRetry={onAnalyze}
          className="mb-6"
        />
      )}

      {/* Analyzing state */}
      {isAnalyzing && (
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
      {hasAnalysis && (
        <div className="space-y-8 pb-8">
          {/* Global AI Summary */}
          {analysisData.global_summary && (
            <GlobalSummaryView summary={analysisData.global_summary} />
          )}

          {/* Data schema preview (if available) */}
          {file.data_schema && (
            <DataPreviewView
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
