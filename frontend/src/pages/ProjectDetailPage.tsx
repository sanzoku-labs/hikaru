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
    selectedFile,
    userIntent,
    isUploading,
    uploadError,
    canSubmit,
    toggleUpload,
    handleFileSelect,
    handleFileRemove,
    handleUserIntentChange,
    handleUploadSubmit,
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
      selectedFile={selectedFile}
      userIntent={userIntent}
      isUploading={isUploading}
      uploadError={uploadError}
      canSubmit={canSubmit}
      onToggleUpload={toggleUpload}
      onFileSelect={handleFileSelect}
      onFileRemove={handleFileRemove}
      onUserIntentChange={handleUserIntentChange}
      onUploadSubmit={handleUploadSubmit}
      onFileClick={navigateToFileAnalysis}
      onCompareClick={navigateToCompare}
      onMergeClick={navigateToMerge}
      onBackClick={navigateBack}
    />
  )
}
