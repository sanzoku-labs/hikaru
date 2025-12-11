import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['projects', projectId, 'files', fileId],
      })
      toast.success(`Analysis complete: ${data.charts.length} charts generated`)
    },
    onError: () => {
      toast.error('Failed to analyze file')
    },
  })
}
