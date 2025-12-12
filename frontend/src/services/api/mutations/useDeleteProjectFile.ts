import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'

/**
 * Delete a file from a project
 */
export const useDeleteProjectFile = (projectId: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (fileId: number) => {
      await apiClient.delete(ENDPOINTS.PROJECTS.DELETE_FILE(projectId, fileId))
    },
    onSuccess: () => {
      // Invalidate project detail to refresh file list
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] })
      toast.success('File deleted')
    },
    onError: () => {
      toast.error('Failed to delete file')
    },
  })
}
