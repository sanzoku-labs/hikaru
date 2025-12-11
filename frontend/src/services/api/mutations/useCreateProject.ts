import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'
import type { ProjectCreate, ProjectResponse } from '@/types/api'

export const useCreateProject = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ProjectCreate) => {
      const response = await apiClient.post<ProjectResponse>(ENDPOINTS.PROJECTS.CREATE, data)
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success(`Project "${data.name}" created`)
    },
    onError: () => {
      toast.error('Failed to create project')
    },
  })
}
