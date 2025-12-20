import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'
import type { HistoryResponse, HistoryFilters } from '@/types/api'

/**
 * Fetch paginated analysis history with optional filters
 */
export const useHistory = (filters: HistoryFilters = {}) => {
  return useQuery({
    queryKey: ['history', filters],
    queryFn: async () => {
      const params = new URLSearchParams()

      if (filters.project_id !== undefined) {
        params.append('project_id', filters.project_id.toString())
      }
      if (filters.search) {
        params.append('search', filters.search)
      }
      if (filters.date_from) {
        params.append('date_from', filters.date_from)
      }
      if (filters.date_to) {
        params.append('date_to', filters.date_to)
      }
      if (filters.page) {
        params.append('page', filters.page.toString())
      }
      if (filters.page_size) {
        params.append('page_size', filters.page_size.toString())
      }

      const queryString = params.toString()
      const url = queryString
        ? `${ENDPOINTS.HISTORY.LIST}?${queryString}`
        : ENDPOINTS.HISTORY.LIST

      const response = await apiClient.get<HistoryResponse>(url)
      return response.data
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}
