import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'

/**
 * Disconnect an integration
 */
export const useDisconnectIntegration = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (integrationId: number) => {
      await apiClient.delete(ENDPOINTS.INTEGRATIONS.DISCONNECT(integrationId))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', 'list'] })
      toast.success('Integration disconnected')
    },
    onError: () => {
      toast.error('Failed to disconnect integration')
    },
  })
}
