import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'
import type { FileAnalysisResponse, FileAnalyzeRequest } from '@/types/api'

export const useAnalyzeProjectFile = (projectId: number, fileId: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: FileAnalyzeRequest = {}) => {
      const { data: response } = await apiClient.post<FileAnalysisResponse>(
        ENDPOINTS.PROJECTS.ANALYZE_FILE(projectId, fileId),
        data
      )
      return response
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({
        queryKey: ['projects', projectId, 'files', fileId],
      })
    },
  })
}
