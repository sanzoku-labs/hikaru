import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'
import type { MergeAnalyzeRequest, MergeAnalyzeResponse } from '@/types/api'

export const useMergeAnalyze = (projectId: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: MergeAnalyzeRequest) => {
      const { data: response } = await apiClient.post<MergeAnalyzeResponse>(
        ENDPOINTS.PROJECTS.MERGE_ANALYZE(projectId),
        data
      )
      return response
    },
    onSuccess: () => {
      // Invalidate project details to refresh merge status
      queryClient.invalidateQueries({
        queryKey: ['projects', projectId],
      })
    },
  })
}
