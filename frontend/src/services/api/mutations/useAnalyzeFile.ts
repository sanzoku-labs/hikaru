import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'
import type { AnalyzeResponse } from '@/types/api'

export const useAnalyzeFile = () => {
  return useMutation({
    mutationFn: async (uploadId: string) => {
      const response = await apiClient.post<AnalyzeResponse>(
        ENDPOINTS.QUICK.ANALYZE(uploadId),
        { user_intent: null } // Send request body with optional user_intent
      )
      return response.data
    },
  })
}
