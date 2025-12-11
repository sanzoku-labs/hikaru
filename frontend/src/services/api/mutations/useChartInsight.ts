import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'
import type { ChartInsightRequest, ChartInsightResponse } from '@/types/api'

/**
 * Mutation hook for generating advanced AI insights for a specific chart
 * Uses Claude Sonnet 4 to provide detailed analysis beyond basic insights
 */
export const useChartInsight = () => {
  return useMutation({
    mutationFn: async (data: ChartInsightRequest) => {
      const response = await apiClient.post<ChartInsightResponse>(
        ENDPOINTS.CHARTS.INSIGHT,
        data
      )
      return response.data
    },
    // No cache invalidation needed - this is a one-off generation
    // The response includes `cached: true` if returned from backend cache
  })
}
