import { Download, RotateCcw, Sparkles, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnalysisFormView } from './AnalysisFormView'
import { UploadProgressView } from './UploadProgressView'
import { DataSummaryView } from './DataSummaryView'
import { GlobalSummaryView } from './GlobalSummaryView'
import { ChartGridView } from '@/views/charts'
import { ChatPanelView } from '@/views/chat'
import { PageHeaderView } from '@/views/shared'
import { CircuitBoard } from '@/components/illustrations'
import type { UploadStage } from '@/hooks/analysis/useQuickAnalysisFlow'
import type { UploadResponse, AnalyzeResponse, ChatMessage } from '@/types/api'

interface QuickAnalysisViewProps {
  // State
  stage: UploadStage
  selectedFile: File | null
  userIntent: string
  uploadData: UploadResponse | null
  analysisData: AnalyzeResponse | null
  error: string | null

  // Handlers
  onFileSelect: (file: File) => void
  onFileRemove: () => void
  onUserIntentChange: (intent: string) => void
  onSubmit: () => void
  onReset: () => void
  onExport: () => void

  // Status
  isExporting: boolean
  canSubmit: boolean

  // Chat
  chatOpen: boolean
  chatMessages: ChatMessage[]
  chatLoading: boolean
  canChat: boolean
  onChatToggle: () => void
  onChatClose: () => void
  onChatSend: (message: string) => void
}

export function QuickAnalysisView({
  stage,
  selectedFile,
  userIntent,
  uploadData,
  analysisData,
  error,
  onFileSelect,
  onFileRemove,
  onUserIntentChange,
  onSubmit,
  onReset,
  onExport,
  isExporting,
  canSubmit,
  // Chat
  chatOpen,
  chatMessages,
  chatLoading,
  canChat,
  onChatToggle,
  onChatClose,
  onChatSend,
}: QuickAnalysisViewProps) {
  const showForm = stage === 'idle'
  const showProgress = stage !== 'idle' && stage !== 'complete'
  const showResults = stage === 'complete' && analysisData

  return (
    <div>
      {/* Header with circuit pattern accent */}
      <div className="relative">
        <CircuitBoard density="sparse" opacity={0.15} className="rounded-lg" />
        <div className="relative">
          <PageHeaderView
            title="Quick Analysis"
            description="Upload a CSV or Excel file to instantly generate charts and AI-powered insights"
            compact
            actions={
          stage !== 'idle' && (
            <div className="flex items-center gap-2">
              {showResults && (
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
                    onClick={onExport}
                    disabled={isExporting}
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
                  </Button>
                </>
              )}
              <Button
                variant="secondary"
                onClick={onReset}
              >
                <RotateCcw className="h-4 w-4" />
                New Analysis
              </Button>
            </div>
          )
        }
          />
        </div>
      </div>

      {/* Analysis form */}
      {showForm && (
        <AnalysisFormView
          selectedFile={selectedFile}
          userIntent={userIntent}
          error={error}
          canSubmit={canSubmit}
          onFileSelect={onFileSelect}
          onFileRemove={onFileRemove}
          onUserIntentChange={onUserIntentChange}
          onSubmit={onSubmit}
        />
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

          {/* Data summary (collapsed by default) */}
          {uploadData?.data_schema && (
            <DataSummaryView
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
              <ChartGridView charts={analysisData.charts} uploadId={uploadData?.upload_id} />
            </div>
          )}
        </div>
      )}

      {/* Chat Panel */}
      <ChatPanelView
        isOpen={chatOpen}
        onClose={onChatClose}
        messages={chatMessages}
        onSendMessage={onChatSend}
        isLoading={chatLoading}
        disabled={!canChat}
      />
    </div>
  )
}
