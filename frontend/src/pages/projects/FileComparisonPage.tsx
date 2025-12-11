import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useFileComparisonFlow } from '@/hooks/projects'
import { useCreateDashboard } from '@/services/api/mutations/useCreateDashboard'
import { FileComparisonView } from '@/views/projects'

export default function FileComparisonPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const numericProjectId = Number(projectId) || 0
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  const {
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
    selectFileA,
    selectFileB,
    setComparisonType,
    runComparison,
    resetComparison,
    navigateBack,
    canCompare,
  } = useFileComparisonFlow(numericProjectId)

  // Save as Dashboard
  const createDashboardMutation = useCreateDashboard(numericProjectId)

  const handleSaveDashboard = (name: string) => {
    if (!comparisonResult) return

    const configJson = JSON.stringify({
      file_ids: [comparisonResult.file_a.id, comparisonResult.file_b.id],
      comparison_type: comparisonResult.comparison_type,
      charts: comparisonResult.overlay_charts,
      global_summary: comparisonResult.summary_insight,
    })

    createDashboardMutation.mutate(
      {
        name,
        dashboard_type: 'comparison',
        config_json: configJson,
      },
      {
        onSuccess: () => {
          setShowSaveDialog(false)
        },
      }
    )
  }

  return (
    <FileComparisonView
      projectName={projectName}
      files={files}
      isLoading={isLoading}
      fetchError={fetchError}
      selectedFileA={selectedFileA}
      selectedFileB={selectedFileB}
      comparisonType={comparisonType}
      comparisonResult={comparisonResult}
      isComparing={isComparing}
      comparisonError={comparisonError}
      onSelectFileA={selectFileA}
      onSelectFileB={selectFileB}
      onComparisonTypeChange={setComparisonType}
      onCompare={runComparison}
      onReset={resetComparison}
      onBackClick={navigateBack}
      canCompare={canCompare}
      // Save as Dashboard
      showSaveDialog={showSaveDialog}
      isSavingDashboard={createDashboardMutation.isPending}
      onOpenSaveDialog={() => setShowSaveDialog(true)}
      onCloseSaveDialog={() => setShowSaveDialog(false)}
      onSaveDashboard={handleSaveDashboard}
    />
  )
}
