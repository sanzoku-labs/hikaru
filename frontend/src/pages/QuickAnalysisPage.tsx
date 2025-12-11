import { useQuickAnalysisFlow } from '@/hooks/analysis'
import { QuickAnalysisView } from '@/views/analysis'

export default function QuickAnalysisPage() {
  const {
    stage,
    selectedFile,
    uploadData,
    analysisData,
    error,
    handleFileSelect,
    handleReset,
    handleExport,
    isExporting,
  } = useQuickAnalysisFlow()

  return (
    <QuickAnalysisView
      stage={stage}
      selectedFile={selectedFile}
      uploadData={uploadData}
      analysisData={analysisData}
      error={error}
      onFileSelect={handleFileSelect}
      onReset={handleReset}
      onExport={handleExport}
      isExporting={isExporting}
    />
  )
}
