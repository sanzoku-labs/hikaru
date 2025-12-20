import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'
import type { IntegrationProviderListResponse } from '@/types/api'

/**
 * Fetch available integration providers
 * Providers are static and rarely change
 */
export const useIntegrationProviders = () => {
  return useQuery({
    queryKey: ['integrations', 'providers'],
    queryFn: async () => {
      const response = await apiClient.get<IntegrationProviderListResponse>(
        ENDPOINTS.INTEGRATIONS.PROVIDERS
      )
      return response.data
    },
    staleTime: 1000 * 60 * 30, // 30 minutes - providers rarely change
  })
}
