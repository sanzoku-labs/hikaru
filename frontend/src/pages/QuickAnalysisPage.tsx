import { useQuickAnalysisFlow } from '@/hooks/analysis'
import { useChatFlow } from '@/hooks/chat'
import { QuickAnalysisView } from '@/views/analysis'

export default function QuickAnalysisPage() {
  const {
    stage,
    selectedFile,
    userIntent,
    uploadData,
    analysisData,
    error,
    handleFileSelect,
    handleFileRemove,
    handleUserIntentChange,
    handleSubmit,
    handleReset,
    handleExport,
    isExporting,
    canSubmit,
  } = useQuickAnalysisFlow()

  const chat = useChatFlow({
    uploadId: uploadData?.upload_id || null,
  })

  // Clear chat when starting a new analysis
  const handleResetWithChat = () => {
    chat.clearChat()
    handleReset()
  }

  return (
    <QuickAnalysisView
      stage={stage}
      selectedFile={selectedFile}
      userIntent={userIntent}
      uploadData={uploadData}
      analysisData={analysisData}
      error={error}
      onFileSelect={handleFileSelect}
      onFileRemove={handleFileRemove}
      onUserIntentChange={handleUserIntentChange}
      onSubmit={handleSubmit}
      onReset={handleResetWithChat}
      onExport={handleExport}
      isExporting={isExporting}
      canSubmit={canSubmit}
      // Chat props
      chatOpen={chat.isOpen}
      chatMessages={chat.messages}
      chatLoading={chat.isLoading}
      canChat={chat.canChat}
      onChatToggle={chat.toggleChat}
      onChatClose={chat.closeChat}
      onChatSend={chat.sendMessage}
    />
  )
}
