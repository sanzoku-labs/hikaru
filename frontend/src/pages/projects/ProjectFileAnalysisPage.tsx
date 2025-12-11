import { useParams } from 'react-router-dom'
import { useFileAnalysisFlow } from '@/hooks/analysis/useFileAnalysisFlow'
import { ProjectFileAnalysisView } from '@/views/projects'

export default function ProjectFileAnalysisPage() {
  const { projectId, fileId } = useParams<{ projectId: string; fileId: string }>()
  const numericProjectId = Number(projectId) || 0
  const numericFileId = Number(fileId) || 0

  const {
    file,
    projectName,
    analysisData,
    isLoading,
    fetchError,
    showReanalyzeForm,
    userIntent,
    handleAnalyze,
    handleUserIntentChange,
    handleToggleReanalyze,
    navigateBack,
    isAnalyzing,
    analysisError,
  } = useFileAnalysisFlow(numericProjectId, numericFileId)

  return (
    <ProjectFileAnalysisView
      file={file}
      projectName={projectName}
      analysisData={analysisData}
      isLoading={isLoading}
      fetchError={fetchError}
      showReanalyzeForm={showReanalyzeForm}
      userIntent={userIntent}
      onAnalyze={handleAnalyze}
      onUserIntentChange={handleUserIntentChange}
      onToggleReanalyze={handleToggleReanalyze}
      onBackClick={navigateBack}
      isAnalyzing={isAnalyzing}
      analysisError={analysisError}
    />
  )
}
