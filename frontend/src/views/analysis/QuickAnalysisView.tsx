import { cn } from '@/lib/utils'
import { Download, RotateCcw, Sparkles } from 'lucide-react'
import { FileUploaderView } from './FileUploaderView'
import { UploadProgressView } from './UploadProgressView'
import { DataPreviewView } from './DataPreviewView'
import { GlobalSummaryView } from './GlobalSummaryView'
import { ChartGridView } from '@/views/charts'
import { PageHeaderView } from '@/views/shared'
import type { UploadStage } from '@/hooks/analysis/useQuickAnalysisFlow'
import type { UploadResponse, AnalyzeResponse } from '@/types/api'

interface QuickAnalysisViewProps {
  // State
  stage: UploadStage
  selectedFile: File | null
  uploadData: UploadResponse | null
  analysisData: AnalyzeResponse | null
  error: string | null

  // Handlers
  onFileSelect: (file: File) => void
  onReset: () => void
  onExport: () => void

  // Status
  isExporting: boolean
}

export function QuickAnalysisView({
  stage,
  selectedFile,
  uploadData,
  analysisData,
  error,
  onFileSelect,
  onReset,
  onExport,
  isExporting,
}: QuickAnalysisViewProps) {
  const showUploader = stage === 'idle'
  const showProgress = stage !== 'idle' && stage !== 'complete'
  const showResults = stage === 'complete' && analysisData

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <PageHeaderView
        title="Quick Analysis"
        description="Upload a CSV or Excel file to instantly generate charts and AI-powered insights"
        actions={
          stage !== 'idle' && (
            <div className="flex items-center gap-2">
              {showResults && (
                <button
                  onClick={onExport}
                  disabled={isExporting}
                  className={cn(
                    'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
                    'bg-primary text-primary-foreground font-medium text-sm',
                    'transition-all duration-200',
                    'hover:bg-primary/90 hover:glow-primary-sm',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {isExporting ? (
                    <>
                      <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Export PDF
                    </>
                  )}
                </button>
              )}
              <button
                onClick={onReset}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
                  'bg-secondary text-secondary-foreground font-medium text-sm',
                  'transition-all duration-200',
                  'hover:bg-secondary/80'
                )}
              >
                <RotateCcw className="h-4 w-4" />
                New Analysis
              </button>
            </div>
          )
        }
      />

      {/* Upload zone */}
      {showUploader && (
        <div className="py-8">
          <FileUploaderView onFileSelect={onFileSelect} error={error} />
        </div>
      )}

      {/* Progress indicator */}
      {showProgress && selectedFile && (
        <div className="py-12">
          <UploadProgressView
            fileName={selectedFile.name}
            fileSize={selectedFile.size}
            stage={stage}
            error={error || undefined}
          />
        </div>
      )}

      {/* Results */}
      {showResults && (
        <div className="space-y-8 pb-8">
          {/* Global AI Summary */}
          {analysisData.global_summary && (
            <GlobalSummaryView summary={analysisData.global_summary} />
          )}

          {/* Data schema preview */}
          {uploadData?.data_schema && (
            <DataPreviewView
              fileName={uploadData.filename}
              dataSchema={uploadData.data_schema}
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
