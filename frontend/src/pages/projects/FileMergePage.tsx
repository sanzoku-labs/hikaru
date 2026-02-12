import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useFileMergeFlow } from '@/hooks/projects'
import { useCreateDashboard } from '@/services/api/mutations/useCreateDashboard'
import { FileMergeView } from '@/views/projects'
import { AnimatedPage } from '@/components/animation'

export default function FileMergePage() {
  const { projectId } = useParams<{ projectId: string }>()
  const numericProjectId = Number(projectId) || 0
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  const {
    projectName,
    files,
    isLoading,
    fetchError,
    currentStep,
    canGoNext,
    canGoBack,
    selectedFileA,
    selectedFileB,
    joinType,
    leftKey,
    rightKey,
    fileAColumns,
    fileBColumns,
    relationship,
    mergeResult,
    isCreatingRelationship,
    isAnalyzing,
    error,
    selectFileA,
    selectFileB,
    setJoinType,
    setLeftKey,
    setRightKey,
    nextStep,
    prevStep,
    executeMerge,
    reset,
    navigateBack,
  } = useFileMergeFlow(numericProjectId)

  // Save as Dashboard
  const createDashboardMutation = useCreateDashboard(numericProjectId)

  const handleSaveDashboard = (name: string) => {
    if (!mergeResult || !selectedFileA || !selectedFileB) return

    const configJson = JSON.stringify({
      file_ids: [selectedFileA.id, selectedFileB.id],
      join_type: joinType,
      left_key: leftKey,
      right_key: rightKey,
      merged_row_count: mergeResult.merged_row_count,
      charts: mergeResult.charts,
      global_summary: mergeResult.global_summary,
    })

    createDashboardMutation.mutate(
      {
        name,
        dashboard_type: 'merged',
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
    <AnimatedPage>
      <FileMergeView
        projectName={projectName}
        files={files}
        isLoading={isLoading}
        fetchError={fetchError}
        currentStep={currentStep}
        canGoNext={canGoNext}
        canGoBack={canGoBack}
        selectedFileA={selectedFileA}
        selectedFileB={selectedFileB}
        joinType={joinType}
        leftKey={leftKey}
        rightKey={rightKey}
        fileAColumns={fileAColumns}
        fileBColumns={fileBColumns}
        relationship={relationship}
        mergeResult={mergeResult}
        isCreatingRelationship={isCreatingRelationship}
        isAnalyzing={isAnalyzing}
        error={error}
        onSelectFileA={selectFileA}
        onSelectFileB={selectFileB}
        onJoinTypeChange={setJoinType}
        onLeftKeyChange={setLeftKey}
        onRightKeyChange={setRightKey}
        onNextStep={nextStep}
        onPrevStep={prevStep}
        onExecuteMerge={executeMerge}
        onReset={reset}
        onBackClick={navigateBack}
        showSaveDialog={showSaveDialog}
        isSavingDashboard={createDashboardMutation.isPending}
        onOpenSaveDialog={() => setShowSaveDialog(true)}
        onCloseSaveDialog={() => setShowSaveDialog(false)}
        onSaveDashboard={handleSaveDashboard}
      />
    </AnimatedPage>
  )
}
