import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'
import type { AnalyticsResponse } from '@/types/api'

/**
 * Query hook for fetching global analytics across all user's projects
 * Returns aggregated statistics, trends, and insights
 */
export const useAnalytics = () => {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const response = await apiClient.get<AnalyticsResponse>(ENDPOINTS.ANALYTICS.GLOBAL)
      return response.data
    },
    staleTime: 1000 * 60 * 2, // 2 minutes (analytics data changes frequently)
    refetchOnMount: 'always', // Always fresh data when mounting analytics page
  })
}
