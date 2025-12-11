import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'
import type { QuickChartInsightRequest, ChartInsightResponse } from '@/types/api'

export const useQuickChartInsight = () => {
  return useMutation({
    mutationFn: async (data: QuickChartInsightRequest) => {
      const response = await apiClient.post<ChartInsightResponse>(
        ENDPOINTS.QUICK.CHART_INSIGHT(data.upload_id),
        data
      )
      return response.data
    },
  })
}
