import { useQuickAnalysisFlow } from '@/hooks/analysis'
import { QuickAnalysisView } from '@/views/analysis'

export default function QuickAnalysisPage() {
  const {
    stage,
    selectedFile,
    userIntent,
    uploadData,
    analysisData,
    error,
    handleFileSelect,
    handleFileRemove,
    handleUserIntentChange,
    handleSubmit,
    handleReset,
    handleExport,
    isExporting,
    canSubmit,
  } = useQuickAnalysisFlow()

  return (
    <QuickAnalysisView
      stage={stage}
      selectedFile={selectedFile}
      userIntent={userIntent}
      uploadData={uploadData}
      analysisData={analysisData}
      error={error}
      onFileSelect={handleFileSelect}
      onFileRemove={handleFileRemove}
      onUserIntentChange={handleUserIntentChange}
      onSubmit={handleSubmit}
      onReset={handleReset}
      onExport={handleExport}
      isExporting={isExporting}
      canSubmit={canSubmit}
    />
  )
}
