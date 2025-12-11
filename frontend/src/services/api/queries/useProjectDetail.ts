import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'
import type { ProjectDetailResponse } from '@/types/api'

export const useProjectDetail = (projectId: number) => {
  return useQuery({
    queryKey: ['projects', projectId],
    queryFn: async () => {
      const response = await apiClient.get<ProjectDetailResponse>(
        ENDPOINTS.PROJECTS.DETAIL(projectId)
      )
      return response.data
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}
