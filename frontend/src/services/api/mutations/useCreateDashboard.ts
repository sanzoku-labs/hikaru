import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'
import type { DashboardCreate, DashboardResponse } from '@/types/api'

export const useCreateDashboard = (projectId: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: DashboardCreate) => {
      const response = await apiClient.post<DashboardResponse>(
        ENDPOINTS.DASHBOARDS.LIST(projectId),
        data
      )
      return response.data
    },
    onSuccess: () => {
      // Invalidate dashboards list for this project
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'dashboards'] })
    },
  })
}
