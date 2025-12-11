import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'
import type { DashboardUpdate, DashboardResponse } from '@/types/api'

export const useUpdateDashboard = (projectId: number, dashboardId: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: DashboardUpdate) => {
      const response = await apiClient.put<DashboardResponse>(
        ENDPOINTS.DASHBOARDS.DETAIL(projectId, dashboardId),
        data
      )
      return response.data
    },
    onSuccess: () => {
      // Invalidate both the specific dashboard and the list
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'dashboards', dashboardId] })
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'dashboards'] })
    },
  })
}
