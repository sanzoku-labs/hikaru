import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'

export const useDeleteDashboard = (projectId: number, dashboardId: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await apiClient.delete(ENDPOINTS.DASHBOARDS.DETAIL(projectId, dashboardId))
    },
    onSuccess: () => {
      // Invalidate dashboards list for this project
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'dashboards'] })
      // Remove the specific dashboard from cache
      queryClient.removeQueries({ queryKey: ['projects', projectId, 'dashboards', dashboardId] })
    },
  })
}
