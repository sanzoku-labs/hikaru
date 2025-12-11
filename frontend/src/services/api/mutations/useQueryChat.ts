import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'
import type { QueryRequest, QueryResponse } from '@/types/api'

/**
 * Mutation hook for Q&A chat with AI about uploaded data.
 * Supports conversation context via conversation_id for follow-up questions.
 * AI can optionally generate charts inline in responses.
 */
export const useQueryChat = () => {
  return useMutation({
    mutationFn: async (data: QueryRequest) => {
      const response = await apiClient.post<QueryResponse>(ENDPOINTS.QUERY, data)
      return response.data
    },
  })
}
