import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'
import type { AnalyzeResponse } from '@/types/api'

interface AnalyzeFileParams {
  uploadId: string
  userIntent?: string | null
}

export const useAnalyzeFile = () => {
  return useMutation({
    mutationFn: async ({ uploadId, userIntent }: AnalyzeFileParams) => {
      const response = await apiClient.post<AnalyzeResponse>(
        ENDPOINTS.QUICK.ANALYZE(uploadId),
        { user_intent: userIntent || null }
      )
      return response.data
    },
  })
}
