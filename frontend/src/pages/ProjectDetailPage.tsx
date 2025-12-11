import { useParams } from 'react-router-dom'
import { useProjectDetailFlow } from '@/hooks/projects/useProjectDetailFlow'
import { useChatFlow } from '@/hooks/chat'
import { ProjectDetailView } from '@/views/projects'

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
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
    />
  )
}
