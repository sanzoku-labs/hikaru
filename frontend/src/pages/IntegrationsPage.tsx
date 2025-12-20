import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { IntegrationsView } from '@/views/integrations'
import { useIntegrationProviders } from '@/services/api/queries/useIntegrationProviders'
import { useIntegrations } from '@/services/api/queries/useIntegrations'
import { useInitiateOAuth } from '@/services/api/mutations/useConnectIntegration'
import { useDisconnectIntegration } from '@/services/api/mutations/useDisconnectIntegration'
import type { IntegrationProvider, IntegrationResponse } from '@/types/api'

export function IntegrationsPage() {
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null)

  // Fetch providers and integrations
  const {
    data: providersData,
    isLoading: providersLoading,
    error: providersError,
  } = useIntegrationProviders()

  const {
    data: integrationsData,
    isLoading: integrationsLoading,
    error: integrationsError,
  } = useIntegrations()

  // Mutations
  const initiateOAuth = useInitiateOAuth()
  const disconnectIntegration = useDisconnectIntegration()

  // Handle connect
  const handleConnect = useCallback(
    async (provider: IntegrationProvider) => {
      setConnectingProvider(provider.id)

      try {
        // Get the redirect URI for OAuth callback
        const redirectUri = `${window.location.origin}/integrations/callback`

        const response = await initiateOAuth.mutateAsync({
          provider: provider.id,
          redirectUri,
        })

        // Store state in sessionStorage for callback validation
        sessionStorage.setItem('oauth_state', response.state)
        sessionStorage.setItem('oauth_provider', provider.id)
        sessionStorage.setItem('oauth_redirect_uri', redirectUri)

        // Redirect to provider's OAuth page
        window.location.href = response.auth_url
      } catch (error) {
        setConnectingProvider(null)
      }
    },
    [initiateOAuth]
  )

  // Handle disconnect
  const handleDisconnect = useCallback(
    (integrationId: number) => {
      disconnectIntegration.mutate(integrationId)
    },
    [disconnectIntegration]
  )

  // Handle browse
  const handleBrowse = useCallback((integration: IntegrationResponse) => {
    // For now, just show a toast since file browser is a more complex feature
    toast.info(`Browse files from ${integration.provider} - Coming soon!`)
  }, [])

  return (
    <IntegrationsView
      // Providers
      providers={providersData?.providers || []}
      providersLoading={providersLoading}
      providersError={providersError?.message || null}
      // Integrations
      integrations={integrationsData?.integrations || []}
      integrationsLoading={integrationsLoading}
      integrationsError={integrationsError?.message || null}
      // Actions
      onConnect={handleConnect}
      isConnecting={connectingProvider}
      onDisconnect={handleDisconnect}
      isDisconnecting={disconnectIntegration.isPending ? disconnectIntegration.variables || null : null}
      onBrowse={handleBrowse}
    />
  )
}
