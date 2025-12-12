import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'
import type { ProjectUpdate, ProjectResponse } from '@/types/api'

/**
 * Update a project's name or description
 */
export const useUpdateProject = (projectId: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ProjectUpdate) => {
      const response = await apiClient.put<ProjectResponse>(
        ENDPOINTS.PROJECTS.UPDATE(projectId),
        data
      )
      return response.data
    },
    onSuccess: (data) => {
      // Update the project detail cache
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] })
      // Also invalidate the projects list to reflect name changes
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success(`Project "${data.name}" updated`)
    },
    onError: () => {
      toast.error('Failed to update project')
    },
  })
}
