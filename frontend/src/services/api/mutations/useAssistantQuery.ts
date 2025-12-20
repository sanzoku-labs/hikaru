import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'
import type {
  AssistantQueryRequest,
  AssistantQueryResponse,
} from '@/types/api'

export function useAssistantQuery() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: AssistantQueryRequest): Promise<AssistantQueryResponse> => {
      const response = await apiClient.post<AssistantQueryResponse>(
        ENDPOINTS.ASSISTANT.QUERY,
        request
      )
      return response.data
    },
    onSuccess: () => {
      // Invalidate conversations list to refresh it
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}
