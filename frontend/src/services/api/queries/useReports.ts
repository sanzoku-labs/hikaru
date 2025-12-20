import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'
import type { ReportListResponse } from '@/types/api'

/**
 * Fetch generated reports for the current user
 * Reports expire after 24 hours, so we use a moderate stale time
 */
export const useReports = () => {
  return useQuery({
    queryKey: ['reports', 'list'],
    queryFn: async () => {
      const response = await apiClient.get<ReportListResponse>(
        ENDPOINTS.REPORTS.LIST
      )
      return response.data
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}
