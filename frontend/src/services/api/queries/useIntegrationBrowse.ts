import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'
import type { ProviderBrowseResponse } from '@/types/api'

/**
 * Browse files in an integration provider
 */
export const useIntegrationBrowse = (
  integrationId: number | null,
  folderId?: string,
  pageToken?: string
) => {
  return useQuery({
    queryKey: ['integrations', integrationId, 'browse', folderId, pageToken],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (folderId) params.append('folder_id', folderId)
      if (pageToken) params.append('page_token', pageToken)

      const queryString = params.toString()
      const url = queryString
        ? `${ENDPOINTS.INTEGRATIONS.BROWSE(integrationId!)}?${queryString}`
        : ENDPOINTS.INTEGRATIONS.BROWSE(integrationId!)

      const response = await apiClient.get<ProviderBrowseResponse>(url)
      return response.data
    },
    enabled: integrationId !== null,
    staleTime: 1000 * 60, // 1 minute
  })
}
