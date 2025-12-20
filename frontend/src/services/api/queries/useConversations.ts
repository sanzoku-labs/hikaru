import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'
import type {
  ConversationListResponse,
  ConversationDetailResponse,
} from '@/types/api'

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async (): Promise<ConversationListResponse> => {
      const response = await apiClient.get<ConversationListResponse>(
        ENDPOINTS.ASSISTANT.CONVERSATIONS
      )
      return response.data
    },
  })
}

export function useConversation(conversationId: string | null) {
  return useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async (): Promise<ConversationDetailResponse> => {
      if (!conversationId) throw new Error('No conversation ID')
      const response = await apiClient.get<ConversationDetailResponse>(
        ENDPOINTS.ASSISTANT.CONVERSATION(conversationId)
      )
      return response.data
    },
    enabled: !!conversationId,
  })
}
