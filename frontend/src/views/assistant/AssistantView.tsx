import { PageHeaderView } from '@/views/shared'
import { FileSelectionPanel } from './FileSelectionPanel'
import { AssistantChatView } from './AssistantChatView'
import { ContextIndicator } from './ContextIndicator'
import type { FileContext, ProjectResponse, ConversationSummary } from '@/types/api'

interface AssistantMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  chart?: any
  timestamp: string
}

interface AssistantViewProps {
  // File selection
  selectedFiles: FileContext[]
  canAddMoreFiles: boolean
  onAddFile: (file: FileContext) => void
  onRemoveFile: (fileId: number) => void
  onClearFiles: () => void

  // Project/file data
  projects: ProjectResponse[]
  isLoadingProjects: boolean

  // Conversation
  conversationId: string | null
  messages: AssistantMessage[]
  onLoadConversation: (id: string) => void
  onStartNewConversation: () => void

  // Conversation list
  conversations: ConversationSummary[]
  isLoadingConversations: boolean
  onDeleteConversation: (id: string) => void

  // Query
  onSendMessage: (question: string) => Promise<void>
  isQuerying: boolean
  queryError: string | null
}

export function AssistantView({
  selectedFiles,
  canAddMoreFiles,
  onAddFile,
  onRemoveFile,
  onClearFiles,
  projects,
  isLoadingProjects,
  conversationId,
  messages,
  onLoadConversation,
  onStartNewConversation,
  conversations,
  isLoadingConversations,
  onDeleteConversation,
  onSendMessage,
  isQuerying,
  queryError,
}: AssistantViewProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 pb-4">
        <PageHeaderView
          title="AI Assistant"
          description="Ask questions across multiple files"
          compact
        />
      </div>

      {/* Main content - Split view */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left panel - File Selection */}
        <div className="w-80 flex-shrink-0 flex flex-col min-h-0">
          <FileSelectionPanel
            projects={projects}
            isLoading={isLoadingProjects}
            selectedFiles={selectedFiles}
            canAddMore={canAddMoreFiles}
            onAddFile={onAddFile}
            onRemoveFile={onRemoveFile}
            conversations={conversations}
            isLoadingConversations={isLoadingConversations}
            currentConversationId={conversationId}
            onSelectConversation={onLoadConversation}
            onNewConversation={onStartNewConversation}
            onDeleteConversation={onDeleteConversation}
          />
        </div>

        {/* Right panel - Chat */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Selected files indicator */}
          {selectedFiles.length > 0 && (
            <div className="flex-shrink-0 mb-4">
              <ContextIndicator
                files={selectedFiles}
                onRemoveFile={onRemoveFile}
                onClear={onClearFiles}
              />
            </div>
          )}

          {/* Chat area */}
          <div className="flex-1 min-h-0">
            <AssistantChatView
              messages={messages}
              isQuerying={isQuerying}
              queryError={queryError}
              onSendMessage={onSendMessage}
              hasFilesSelected={selectedFiles.length > 0}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
