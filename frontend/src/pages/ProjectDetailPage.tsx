import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProjectDetailFlow } from '@/hooks/projects/useProjectDetailFlow'
import { useChatFlow } from '@/hooks/chat'
import { useDashboards } from '@/services/api/queries/useDashboards'
import { useDeleteDashboard } from '@/services/api/mutations/useDeleteDashboard'
import { useDeleteProjectFile } from '@/services/api/mutations/useDeleteProjectFile'
import { useUpdateProject } from '@/services/api/mutations/useUpdateProject'
import { ProjectDetailView } from '@/views/projects'

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const numericProjectId = Number(projectId) || 0

  const {
    project,
    isLoading,
    fetchError,
    selectedFileId,
    selectedFile,
    analysisData,
    isLoadingAnalysis,
    analysisError,
    showReanalyzeForm,
    reanalyzeIntent,
    showUpload,
    uploadFile,
    uploadIntent,
    isUploading,
    uploadError,
    canSubmit,
    selectFile,
    handleAnalyze,
    handleReanalyzeIntentChange,
    toggleReanalyzeForm,
    toggleUpload,
    handleUploadFileSelect,
    handleUploadFileRemove,
    handleUploadIntentChange,
    handleUploadSubmit,
    navigateToCompare,
    navigateToMerge,
    navigateBack,
    isAnalyzing,
  } = useProjectDetailFlow(numericProjectId)

  // Dashboards for this project
  const { data: dashboardsData, isLoading: isLoadingDashboards } = useDashboards(numericProjectId)
  const deleteDashboardMutation = useDeleteDashboard(numericProjectId)

  const handleViewDashboard = (dashboardId: number) => {
    navigate(`/projects/${projectId}/dashboards/${dashboardId}`)
  }

  const handleDeleteDashboard = (dashboardId: number) => {
    deleteDashboardMutation.mutate(dashboardId)
  }

  // File deletion
  const deleteFileMutation = useDeleteProjectFile(numericProjectId)

  const handleDeleteFile = (fileId: number) => {
    // If deleting the currently selected file, clear selection
    if (fileId === selectedFileId) {
      selectFile(0) // Deselect
    }
    deleteFileMutation.mutate(fileId)
  }

  // Project editing
  const [showEditProject, setShowEditProject] = useState(false)
  const updateProjectMutation = useUpdateProject(numericProjectId)

  const handleUpdateProject = (name: string, description: string) => {
    updateProjectMutation.mutate(
      { name, description },
      {
        onSuccess: () => {
          setShowEditProject(false)
        },
      }
    )
  }

  // Chat for the selected file (uses the file's upload_id)
  const chat = useChatFlow({
    uploadId: selectedFile?.upload_id || null,
  })

  // Clear chat when selecting a different file
  const handleSelectFile = (fileId: number) => {
    if (fileId !== selectedFileId) {
      chat.clearChat()
    }
    selectFile(fileId)
  }

  return (
    <ProjectDetailView
      project={project}
      isLoading={isLoading}
      fetchError={fetchError}
      selectedFileId={selectedFileId}
      selectedFile={selectedFile}
      analysisData={analysisData}
      isLoadingAnalysis={isLoadingAnalysis}
      analysisError={analysisError}
      showReanalyzeForm={showReanalyzeForm}
      reanalyzeIntent={reanalyzeIntent}
      showUpload={showUpload}
      uploadFile={uploadFile}
      uploadIntent={uploadIntent}
      isUploading={isUploading}
      uploadError={uploadError}
      canSubmit={canSubmit}
      onSelectFile={handleSelectFile}
      onAnalyze={handleAnalyze}
      onReanalyzeIntentChange={handleReanalyzeIntentChange}
      onToggleReanalyzeForm={toggleReanalyzeForm}
      onToggleUpload={toggleUpload}
      onUploadFileSelect={handleUploadFileSelect}
      onUploadFileRemove={handleUploadFileRemove}
      onUploadIntentChange={handleUploadIntentChange}
      onUploadSubmit={handleUploadSubmit}
      onCompareClick={navigateToCompare}
      onMergeClick={navigateToMerge}
      onBackClick={navigateBack}
      isAnalyzing={isAnalyzing}
      // Chat props
      chatOpen={chat.isOpen}
      chatMessages={chat.messages}
      chatLoading={chat.isLoading}
      canChat={chat.canChat && !!analysisData}
      onChatToggle={chat.toggleChat}
      onChatClose={chat.closeChat}
      onChatSend={chat.sendMessage}
      // Dashboard props
      dashboards={dashboardsData?.dashboards || []}
      isLoadingDashboards={isLoadingDashboards}
      onViewDashboard={handleViewDashboard}
      onDeleteDashboard={handleDeleteDashboard}
      isDeletingDashboard={deleteDashboardMutation.isPending ? deleteDashboardMutation.variables : null}
      // File deletion props
      onDeleteFile={handleDeleteFile}
      isDeletingFile={deleteFileMutation.isPending ? deleteFileMutation.variables : null}
      // Project editing props
      showEditProject={showEditProject}
      isUpdatingProject={updateProjectMutation.isPending}
      onOpenEditProject={() => setShowEditProject(true)}
      onCloseEditProject={() => setShowEditProject(false)}
      onUpdateProject={handleUpdateProject}
    />
  )
}
