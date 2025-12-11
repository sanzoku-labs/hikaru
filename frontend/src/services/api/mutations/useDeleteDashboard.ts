import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'

/**
 * Delete a dashboard - accepts dashboardId as mutation parameter
 * This pattern allows a single hook instance to delete any dashboard in a list
 */
export const useDeleteDashboard = (projectId: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (dashboardId: number) => {
      await apiClient.delete(ENDPOINTS.DASHBOARDS.DETAIL(projectId, dashboardId))
    },
    onSuccess: (_data, dashboardId) => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'dashboards'] })
      queryClient.removeQueries({ queryKey: ['projects', projectId, 'dashboards', dashboardId] })
      toast.success('Dashboard deleted')
    },
    onError: () => {
      toast.error('Failed to delete dashboard')
    },
  })
}
