import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'
import type { OAuthInitiateResponse, IntegrationResponse, IntegrationCreate } from '@/types/api'

/**
 * Initiate OAuth flow for a provider
 * Returns the auth URL to redirect user to
 */
export const useInitiateOAuth = () => {
  return useMutation({
    mutationFn: async ({
      provider,
      redirectUri,
    }: {
      provider: string
      redirectUri: string
    }) => {
      const response = await apiClient.post<OAuthInitiateResponse>(
        `${ENDPOINTS.INTEGRATIONS.OAUTH_INITIATE(provider)}?redirect_uri=${encodeURIComponent(redirectUri)}`
      )
      return response.data
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to initiate OAuth')
    },
  })
}

/**
 * Complete OAuth flow after authorization
 */
export const useCompleteOAuth = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      provider,
      code,
      state,
      redirectUri,
    }: {
      provider: string
      code: string
      state: string
      redirectUri: string
    }) => {
      const request: IntegrationCreate = {
        provider,
        code,
        redirect_uri: redirectUri,
      }
      const response = await apiClient.post<IntegrationResponse>(
        `${ENDPOINTS.INTEGRATIONS.OAUTH_CALLBACK(provider)}?state=${encodeURIComponent(state)}`,
        request
      )
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['integrations', 'list'] })
      toast.success(`Connected to ${data.provider}`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to complete OAuth')
    },
  })
}
