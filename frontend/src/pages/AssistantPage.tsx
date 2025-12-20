import { useAssistantFlow } from '@/hooks/assistant'
import { AssistantView } from '@/views/assistant'

export default function AssistantPage() {
  const flow = useAssistantFlow()

  return (
    <AssistantView
      // File selection
      selectedFiles={flow.selectedFiles}
      canAddMoreFiles={flow.canAddMoreFiles}
      onAddFile={flow.addFile}
      onRemoveFile={flow.removeFile}
      onClearFiles={flow.clearFiles}
      // Project/file data
      projects={flow.projects}
      isLoadingProjects={flow.isLoadingProjects}
      // Conversation
      conversationId={flow.conversationId}
      messages={flow.messages}
      onLoadConversation={flow.loadConversation}
      onStartNewConversation={flow.startNewConversation}
      // Conversation list
      conversations={flow.conversations}
      isLoadingConversations={flow.isLoadingConversations}
      onDeleteConversation={flow.deleteConversation}
      // Query
      onSendMessage={flow.sendMessage}
      isQuerying={flow.isQuerying}
      queryError={flow.queryError}
    />
  )
}
