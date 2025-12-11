import { useParams } from 'react-router-dom'
import { useProjectDetailFlow } from '@/hooks/projects/useProjectDetailFlow'
import { ProjectDetailView } from '@/views/projects'

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const numericProjectId = Number(projectId) || 0

  const {
    project,
    isLoading,
    fetchError,
    showUpload,
    isUploading,
    uploadError,
    toggleUpload,
    handleFileUpload,
    navigateToFileAnalysis,
    navigateToCompare,
    navigateToMerge,
    navigateBack,
  } = useProjectDetailFlow(numericProjectId)

  return (
    <ProjectDetailView
      project={project}
      isLoading={isLoading}
      fetchError={fetchError}
      showUpload={showUpload}
      isUploading={isUploading}
      uploadError={uploadError}
      onToggleUpload={toggleUpload}
      onFileUpload={handleFileUpload}
      onFileClick={navigateToFileAnalysis}
      onCompareClick={navigateToCompare}
      onMergeClick={navigateToMerge}
      onBackClick={navigateBack}
    />
  )
}
