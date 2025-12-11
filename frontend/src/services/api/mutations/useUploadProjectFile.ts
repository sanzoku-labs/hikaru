import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'
import type { ProjectFileUploadResponse } from '@/types/api'

export const useUploadProjectFile = (projectId: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)

      const response = await apiClient.post<ProjectFileUploadResponse>(
        ENDPOINTS.PROJECTS.UPLOAD_FILE(projectId),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] })
      toast.success(`File "${data.filename}" uploaded`)
    },
    onError: () => {
      toast.error('Failed to upload file')
    },
  })
}
