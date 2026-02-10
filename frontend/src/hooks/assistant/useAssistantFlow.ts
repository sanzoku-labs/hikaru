import { useCallback, useEffect } from 'react'
import { useProjects } from '@/services/api/queries/useProjects'
import { useConversations, useConversation } from '@/services/api/queries/useConversations'
import { useAssistantQuery } from '@/services/api/mutations/useAssistantQuery'
import { useDeleteConversation } from '@/services/api/mutations/useDeleteConversation'
import { useAssistantStore } from '@/stores/assistantStore'
import type { FileContext, ProjectResponse, ChartData } from '@/types/api'

export interface UseAssistantFlowReturn {
  // File selection
  selectedFiles: FileContext[]
  canAddMoreFiles: boolean
  addFile: (file: FileContext) => void
  removeFile: (fileId: number) => void
  clearFiles: () => void

  // Project/file data
  projects: ProjectResponse[]
  isLoadingProjects: boolean

  // Conversation
  conversationId: string | null
  messages: Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
    chart?: ChartData | null
    timestamp: string
  }>
  loadConversation: (id: string) => void
  startNewConversation: () => void

  // Conversation list
  conversations: Array<{
    conversation_id: string
    title: string | null
    file_context: FileContext[]
    message_count: number
    created_at: string
    updated_at: string
  }>
  isLoadingConversations: boolean
  deleteConversation: (id: string) => void

  // Query
  sendMessage: (question: string) => Promise<void>
  isQuerying: boolean
  queryError: string | null
}

export function useAssistantFlow(): UseAssistantFlowReturn {
  // Store state
  const selectedFiles = useAssistantStore((state) => state.selectedFiles)
  const addFileToStore = useAssistantStore((state) => state.addFile)
  const removeFileFromStore = useAssistantStore((state) => state.removeFile)
  const clearFilesInStore = useAssistantStore((state) => state.clearFiles)
  const conversationId = useAssistantStore((state) => state.conversationId)
  const messages = useAssistantStore((state) => state.messages)
  const setConversationId = useAssistantStore((state) => state.setConversationId)
  const addMessage = useAssistantStore((state) => state.addMessage)
  const loadMessages = useAssistantStore((state) => state.loadMessages)
  const clearConversation = useAssistantStore((state) => state.clearConversation)

  // Data queries
  const { data: projects, isLoading: isLoadingProjects } = useProjects()
  const { data: conversationsData, isLoading: isLoadingConversations } = useConversations()
  const { data: conversationDetail } = useConversation(conversationId)

  // Mutations
  const queryMutation = useAssistantQuery()
  const deleteMutation = useDeleteConversation()

  // File selection
  const canAddMoreFiles = selectedFiles.length < 5

  const addFile = useCallback(
    (file: FileContext) => {
      if (canAddMoreFiles) {
        addFileToStore(file)
      }
    },
    [canAddMoreFiles, addFileToStore]
  )

  const removeFile = useCallback(
    (fileId: number) => {
      removeFileFromStore(fileId)
    },
    [removeFileFromStore]
  )

  const clearFiles = useCallback(() => {
    clearFilesInStore()
  }, [clearFilesInStore])

  // Conversation management
  const loadConversation = useCallback(
    (id: string) => {
      setConversationId(id)
    },
    [setConversationId]
  )

  const startNewConversation = useCallback(() => {
    clearConversation()
    clearFilesInStore()
  }, [clearConversation, clearFilesInStore])

  // Load conversation messages when detail is fetched
  useEffect(() => {
    if (conversationDetail && conversationId) {
      loadMessages(conversationDetail.messages, conversationId)
      // Also restore file context
      conversationDetail.file_context.forEach((fc) => {
        addFileToStore(fc)
      })
    }
  }, [conversationDetail, conversationId, loadMessages, addFileToStore])

  // Send message
  const sendMessage = useCallback(
    async (question: string) => {
      if (selectedFiles.length === 0) {
        throw new Error('Please select at least one file to query')
      }

      // Add user message to UI immediately
      const userMessageId = `user-${crypto.randomUUID()}`
      addMessage({
        id: userMessageId,
        role: 'user',
        content: question,
        timestamp: new Date().toISOString(),
      })

      // Send to API
      const response = await queryMutation.mutateAsync({
        file_ids: selectedFiles.map((f) => f.file_id),
        question,
        conversation_id: conversationId || undefined,
      })

      // Update conversation ID if new
      if (!conversationId) {
        setConversationId(response.conversation_id)
      }

      // Add assistant response
      addMessage({
        id: `assistant-${crypto.randomUUID()}`,
        role: 'assistant',
        content: response.answer,
        chart: response.chart,
        timestamp: response.timestamp,
      })
    },
    [selectedFiles, conversationId, queryMutation, addMessage, setConversationId]
  )

  // Delete conversation
  const deleteConversation = useCallback(
    (id: string) => {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          // If we deleted the current conversation, clear it
          if (id === conversationId) {
            clearConversation()
          }
        },
      })
    },
    [deleteMutation, conversationId, clearConversation]
  )

  return {
    // File selection
    selectedFiles,
    canAddMoreFiles,
    addFile,
    removeFile,
    clearFiles,

    // Project/file data
    projects: projects || [],
    isLoadingProjects,

    // Conversation
    conversationId,
    messages,
    loadConversation,
    startNewConversation,

    // Conversation list
    conversations: conversationsData?.conversations || [],
    isLoadingConversations,
    deleteConversation,

    // Query
    sendMessage,
    isQuerying: queryMutation.isPending,
    queryError: queryMutation.error?.message || null,
  }
}
