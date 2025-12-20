import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'
import type { ReportGenerateRequest, ReportGenerateResponse } from '@/types/api'

/**
 * Generate a report from a template
 * Invalidates reports list on success
 */
export const useGenerateReport = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: ReportGenerateRequest) => {
      const response = await apiClient.post<ReportGenerateResponse>(
        ENDPOINTS.REPORTS.GENERATE,
        request
      )
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'list'] })
      toast.success(`Report "${data.report.title}" generated in ${data.generation_time_ms}ms`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to generate report')
    },
  })
}
