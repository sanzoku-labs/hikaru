import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'
import type { IntegrationListResponse } from '@/types/api'

/**
 * Fetch connected integrations for the current user
 */
export const useIntegrations = () => {
  return useQuery({
    queryKey: ['integrations', 'list'],
    queryFn: async () => {
      const response = await apiClient.get<IntegrationListResponse>(
        ENDPOINTS.INTEGRATIONS.LIST
      )
      return response.data
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}
