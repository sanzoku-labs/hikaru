import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'
import type { DashboardResponse } from '@/types/api'

/**
 * Query hook for fetching a single dashboard by ID
 */
export const useDashboard = (projectId: number, dashboardId: number) => {
  return useQuery({
    queryKey: ['projects', projectId, 'dashboards', dashboardId],
    queryFn: async () => {
      const response = await apiClient.get<DashboardResponse>(
        ENDPOINTS.DASHBOARDS.DETAIL(projectId, dashboardId)
      )
      return response.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!projectId && !!dashboardId, // Only run if both IDs provided
  })
}
