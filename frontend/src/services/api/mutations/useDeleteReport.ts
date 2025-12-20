import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'

/**
 * Delete a generated report
 * Accepts reportId as mutation parameter
 */
export const useDeleteReport = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (reportId: string) => {
      await apiClient.delete(ENDPOINTS.REPORTS.DELETE(reportId))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'list'] })
      toast.success('Report deleted')
    },
    onError: () => {
      toast.error('Failed to delete report')
    },
  })
}
