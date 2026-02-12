import { useAssistantFlow } from '@/hooks/assistant'
import { AssistantView } from '@/views/assistant'
import { AnimatedPage } from '@/components/animation'

export default function AssistantPage() {
  const flow = useAssistantFlow()

  return (
    <AnimatedPage>
      <AssistantView
        selectedFiles={flow.selectedFiles}
        canAddMoreFiles={flow.canAddMoreFiles}
        onAddFile={flow.addFile}
        onRemoveFile={flow.removeFile}
        onClearFiles={flow.clearFiles}
        projects={flow.projects}
        isLoadingProjects={flow.isLoadingProjects}
        conversationId={flow.conversationId}
        messages={flow.messages}
        onLoadConversation={flow.loadConversation}
        onStartNewConversation={flow.startNewConversation}
        conversations={flow.conversations}
        isLoadingConversations={flow.isLoadingConversations}
        onDeleteConversation={flow.deleteConversation}
        onSendMessage={flow.sendMessage}
        isQuerying={flow.isQuerying}
        queryError={flow.queryError}
      />
    </AnimatedPage>
  )
}
