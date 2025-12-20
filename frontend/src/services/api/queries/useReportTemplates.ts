import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'
import type { ReportTemplateListResponse } from '@/types/api'

/**
 * Fetch available report templates
 * Templates are static and rarely change, so we use a longer stale time
 */
export const useReportTemplates = () => {
  return useQuery({
    queryKey: ['reports', 'templates'],
    queryFn: async () => {
      const response = await apiClient.get<ReportTemplateListResponse>(
        ENDPOINTS.REPORTS.TEMPLATES
      )
      return response.data
    },
    staleTime: 1000 * 60 * 30, // 30 minutes - templates rarely change
  })
}
