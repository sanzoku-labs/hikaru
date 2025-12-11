import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'
import type { DashboardListResponse } from '@/types/api'

/**
 * Query hook for fetching all dashboards in a project
 */
export const useDashboards = (projectId: number) => {
  return useQuery({
    queryKey: ['projects', projectId, 'dashboards'],
    queryFn: async () => {
      const response = await apiClient.get<DashboardListResponse>(
        ENDPOINTS.DASHBOARDS.LIST(projectId)
      )
      return response.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!projectId, // Only run query if projectId is provided
  })
}
