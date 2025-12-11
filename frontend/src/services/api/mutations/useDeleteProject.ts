import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'

export const useDeleteProject = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (projectId: number) => {
      await apiClient.delete(ENDPOINTS.PROJECTS.DELETE(projectId))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project deleted')
    },
    onError: () => {
      toast.error('Failed to delete project')
    },
  })
}
