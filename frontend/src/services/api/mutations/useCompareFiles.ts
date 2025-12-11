import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'
import type { CompareFilesRequest, ComparisonResponse } from '@/types/api'

export const useCompareFiles = (projectId: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CompareFilesRequest) => {
      const { data: response } = await apiClient.post<ComparisonResponse>(
        ENDPOINTS.PROJECTS.COMPARE_FILES(projectId),
        data
      )
      return response
    },
    onSuccess: () => {
      // Invalidate relationships query
      queryClient.invalidateQueries({
        queryKey: ['projects', projectId, 'relationships'],
      })
    },
  })
}
