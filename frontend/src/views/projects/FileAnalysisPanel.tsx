import React from 'react'
import { formatFileSize, formatDate } from '@/lib/utils'
import {
  FileSpreadsheet,
  X,
  Sparkles,
  Play,
  RotateCcw,
  MessageSquare,
} from 'lucide-react'
import { LoadingSpinnerView, ErrorAlertView } from '@/views/shared'
import { GlobalSummaryView, DataSummaryView } from '@/views/analysis'
import { ChartGridView } from '@/views/charts'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { ProjectFileResponse, FileAnalysisResponse } from '@/types/api'

interface FileAnalysisPanelProps {
  selectedFile: ProjectFileResponse | null
  analysisData: FileAnalysisResponse | null
  isLoadingAnalysis: boolean
  analysisError: string | null
  showReanalyzeForm: boolean
  reanalyzeIntent: string
  isAnalyzing: boolean
  hasAnalysis: boolean
  canChat: boolean
  filesExist: boolean
  onAnalyze: (intent?: string) => void
  onReanalyzeIntentChange: (intent: string) => void
  onToggleReanalyzeForm: () => void
  onChatToggle: () => void
}

export const FileAnalysisPanel = React.memo(function FileAnalysisPanel({
  selectedFile,
  analysisData,
  isLoadingAnalysis,
  analysisError,
  showReanalyzeForm,
  reanalyzeIntent,
  isAnalyzing,
  hasAnalysis,
  canChat,
  filesExist,
  onAnalyze,
  onReanalyzeIntentChange,
  onToggleReanalyzeForm,
  onChatToggle,
}: FileAnalysisPanelProps) {
  return (
    <div className="flex-1 min-w-0 overflow-y-auto pl-6">
      {/* No file selected */}
      {!selectedFile && filesExist && (
        <div className="h-full flex items-center justify-center">
          <p className="text-muted-foreground">Select a file to view analysis</p>
        </div>
      )}

      {/* File selected */}
      {selectedFile && (
        <div className="space-y-6 pb-6">
          {/* File header with actions */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">{selectedFile.filename}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {formatFileSize(selectedFile.file_size)} · {selectedFile.data_schema?.row_count?.toLocaleString() || '?'} rows · Uploaded {formatDate(selectedFile.uploaded_at)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {hasAnalysis && (
                <>
                  <Button
                    variant="secondary"
                    onClick={onChatToggle}
                    disabled={!canChat}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Ask AI
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={onToggleReanalyzeForm}
                    disabled={isAnalyzing}
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
                  </Button>
                </>
              )}
              {!hasAnalysis && (
                <Button
                  onClick={() => onAnalyze()}
                  disabled={isAnalyzing}
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
                </Button>
              )}
            </div>
          </div>

          {/* Re-analyze form */}
          {showReanalyzeForm && (
            <div className="p-6 rounded-xl border bg-card animate-in-up">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reanalyze-intent" className="text-sm font-medium">
                    What would you like to learn from this data?
                    <span className="text-muted-foreground font-normal ml-1">(optional)</span>
                  </Label>
                  <Textarea
                    id="reanalyze-intent"
                    placeholder="e.g., Focus on trends over time, or Compare categories..."
                    value={reanalyzeIntent}
                    onChange={(e) => onReanalyzeIntentChange(e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                </div>
                <Button
                  onClick={() => onAnalyze()}
                  disabled={isAnalyzing}
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
                </Button>
              </div>
            </div>
          )}

          {/* Analysis error */}
          {analysisError && (
            <ErrorAlertView
              title="Analysis failed"
              message={analysisError}
              onRetry={() => onAnalyze()}
            />
          )}

          {/* Loading analysis */}
          {isLoadingAnalysis && (
            <div className="py-12">
              <LoadingSpinnerView size="lg" label="Loading analysis..." />
            </div>
          )}

          {/* Analyzing state */}
          {isAnalyzing && !showReanalyzeForm && (
            <div className="py-12">
              <LoadingSpinnerView size="lg" label="Analyzing your data and generating insights..." />
            </div>
          )}

          {/* No analysis yet */}
          {!hasAnalysis && !isAnalyzing && !isLoadingAnalysis && (
            <div className="py-12 text-center">
              <div className="inline-flex p-4 rounded-2xl bg-muted/50 text-muted-foreground mb-4">
                <FileSpreadsheet className="h-12 w-12" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Ready to analyze
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Click "Analyze File" to generate charts and AI-powered insights from your data.
              </p>
            </div>
          )}

          {/* Analysis results */}
          {hasAnalysis && !showReanalyzeForm && !isLoadingAnalysis && analysisData && (
            <div className="space-y-8">
              {/* Global AI Summary */}
              {analysisData.global_summary && (
                <GlobalSummaryView summary={analysisData.global_summary} />
              )}

              {/* Data summary (collapsed by default) */}
              {selectedFile.data_schema && (
                <DataSummaryView
                  fileName={selectedFile.filename}
                  dataSchema={selectedFile.data_schema}
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
                  <ChartGridView charts={analysisData.charts} fileId={selectedFile.id} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
})
