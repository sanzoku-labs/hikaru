import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['projects', projectId],
      })
      toast.success(`Merge complete: ${data.merged_row_count.toLocaleString()} rows`)
    },
    onError: () => {
      toast.error('Failed to merge files')
    },
  })
}
