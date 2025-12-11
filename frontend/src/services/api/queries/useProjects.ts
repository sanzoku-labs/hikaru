import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'
import type { ProjectResponse } from '@/types/api'

interface ProjectListResponse {
  projects: ProjectResponse[]
  total: number
}

export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await apiClient.get<ProjectListResponse>(ENDPOINTS.PROJECTS.LIST)
      // Backend returns { projects: [...], total: number }, extract just the projects array
      return response.data.projects
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
