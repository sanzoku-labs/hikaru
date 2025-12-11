import { useState, useCallback } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { useQueryChat } from '@/services/api/mutations/useQueryChat'
import type { ChatMessage } from '@/types/api'

interface UseChatFlowOptions {
  uploadId: string | null
}

export function useChatFlow({ uploadId }: UseChatFlowOptions) {
  const { chatPanelOpen, toggleChat } = useUIStore()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)

  const chatMutation = useQueryChat()

  const sendMessage = useCallback(
    async (content: string) => {
      if (!uploadId) return

      // Create user message
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      }

      // Add user message immediately
      setMessages((prev) => [...prev, userMessage])

      try {
        // Send to API
        const response = await chatMutation.mutateAsync({
          upload_id: uploadId,
          question: content,
          conversation_id: conversationId || undefined,
        })

        // Update conversation ID
        setConversationId(response.conversation_id)

        // Create assistant message
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.answer,
          timestamp: response.timestamp,
          chart: response.chart,
        }

        // Add assistant message
        setMessages((prev) => [...prev, assistantMessage])
      } catch (error) {
        // Add error message
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content:
            'Sorry, I encountered an error processing your request. Please try again.',
          timestamp: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, errorMessage])
      }
    },
    [uploadId, conversationId, chatMutation]
  )

  const clearChat = useCallback(() => {
    setMessages([])
    setConversationId(null)
  }, [])

  const openChat = useCallback(() => {
    if (!chatPanelOpen) {
      toggleChat()
    }
  }, [chatPanelOpen, toggleChat])

  const closeChat = useCallback(() => {
    if (chatPanelOpen) {
      toggleChat()
    }
  }, [chatPanelOpen, toggleChat])

  return {
    // State
    isOpen: chatPanelOpen,
    messages,
    isLoading: chatMutation.isPending,

    // Actions
    sendMessage,
    openChat,
    closeChat,
    toggleChat,
    clearChat,

    // Computed
    canChat: !!uploadId,
  }
}
