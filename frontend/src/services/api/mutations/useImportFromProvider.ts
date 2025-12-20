import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'
import type { ImportFromProviderRequest, ImportFromProviderResponse } from '@/types/api'

/**
 * Import a file from an integration provider
 */
export const useImportFromProvider = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: ImportFromProviderRequest) => {
      const response = await apiClient.post<ImportFromProviderResponse>(
        ENDPOINTS.INTEGRATIONS.IMPORT,
        request
      )
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects', data.project_id] })
      toast.success(`Imported ${data.filename}`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to import file')
    },
  })
}
