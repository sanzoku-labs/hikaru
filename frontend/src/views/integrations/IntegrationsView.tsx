import { cn, formatDate } from '@/lib/utils'
import {
  Cloud,
  Database,
  FileSpreadsheet,
  FileText,
  Link2,
  Link2Off,
  Loader2,
  ExternalLink,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeaderView, LoadingSpinnerView, ErrorAlertView, EmptyStateView } from '@/views/shared'
import type { IntegrationProvider, IntegrationResponse } from '@/types/api'

interface IntegrationsViewProps {
  // Providers
  providers: IntegrationProvider[]
  providersLoading: boolean
  providersError: string | null

  // Connected integrations
  integrations: IntegrationResponse[]
  integrationsLoading: boolean
  integrationsError: string | null

  // Actions
  onConnect: (provider: IntegrationProvider) => void
  isConnecting: string | null
  onDisconnect: (integrationId: number) => void
  isDisconnecting: number | null
  onBrowse: (integration: IntegrationResponse) => void
}

// Icon mapping for providers
const providerIcons: Record<string, React.ReactNode> = {
  table: <FileSpreadsheet className="h-6 w-6" />,
  database: <Database className="h-6 w-6" />,
  'file-text': <FileText className="h-6 w-6" />,
  cloud: <Cloud className="h-6 w-6" />,
}

// Provider name mapping
const providerNames: Record<string, string> = {
  google_sheets: 'Google Sheets',
  airtable: 'Airtable',
  notion: 'Notion',
  dropbox: 'Dropbox',
}

// Provider card component
function ProviderCard({
  provider,
  onConnect,
  isConnecting,
  isConnected,
}: {
  provider: IntegrationProvider
  onConnect: () => void
  isConnecting: boolean
  isConnected: boolean
}) {
  return (
    <Card
      className={cn(
        'transition-all duration-200',
        'hover:shadow-md',
        isConnected && 'border-green-500/30 bg-green-500/5'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
            {providerIcons[provider.icon] || <Link2 className="h-6 w-6" />}
          </div>
          {isConnected ? (
            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-700 border-green-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          ) : !provider.is_available ? (
            <Badge variant="outline" className="text-xs bg-gray-500/10 text-gray-500 border-gray-200">
              <XCircle className="h-3 w-3 mr-1" />
              Not Configured
            </Badge>
          ) : null}
        </div>
        <CardTitle className="text-lg mt-3">{provider.name}</CardTitle>
        <CardDescription className="line-clamp-2">
          {provider.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Button
          variant={isConnected ? 'outline' : 'default'}
          className="w-full"
          onClick={onConnect}
          disabled={isConnecting || !provider.is_available}
        >
          {isConnecting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Connecting...
            </>
          ) : isConnected ? (
            <>
              <ExternalLink className="h-4 w-4 mr-2" />
              Browse Files
            </>
          ) : (
            <>
              <Link2 className="h-4 w-4 mr-2" />
              Connect
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

// Connected integration card
function ConnectedIntegrationCard({
  integration,
  onDisconnect,
  isDisconnecting,
  onBrowse,
}: {
  integration: IntegrationResponse
  onDisconnect: () => void
  isDisconnecting: boolean
  onBrowse: () => void
}) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="p-2.5 rounded-lg bg-green-500/10 text-green-600 flex-shrink-0">
            {providerIcons['table'] || <Link2 className="h-5 w-5" />}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground">
              {providerNames[integration.provider] || integration.provider}
            </h3>

            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              {integration.provider_email && (
                <>
                  <span>{integration.provider_email}</span>
                  <span className="text-muted-foreground/50">·</span>
                </>
              )}
              <span>Connected {formatDate(integration.created_at)}</span>
            </div>

            {integration.last_used_at && (
              <p className="text-xs text-muted-foreground mt-1">
                Last used {formatDate(integration.last_used_at)}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={onBrowse}>
              <ExternalLink className="h-4 w-4 mr-1.5" />
              Browse
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={onDisconnect}
              disabled={isDisconnecting}
            >
              {isDisconnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Link2Off className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function IntegrationsView({
  providers,
  providersLoading,
  providersError,
  integrations,
  integrationsLoading,
  integrationsError,
  onConnect,
  isConnecting,
  onDisconnect,
  isDisconnecting,
  onBrowse,
}: IntegrationsViewProps) {
  // Check if a provider is connected
  const isProviderConnected = (providerId: string) =>
    integrations.some((i) => i.provider === providerId && i.is_active)

  // Get integration for a provider
  const getIntegrationForProvider = (providerId: string) =>
    integrations.find((i) => i.provider === providerId && i.is_active)

  const handleConnect = (provider: IntegrationProvider) => {
    const existing = getIntegrationForProvider(provider.id)
    if (existing) {
      onBrowse(existing)
    } else {
      onConnect(provider)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeaderView
        title="Integrations"
        description="Connect external data sources to import files directly"
        compact
      />

      <Tabs defaultValue="providers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="providers">
            <Link2 className="h-4 w-4 mr-2" />
            Available Sources
          </TabsTrigger>
          <TabsTrigger value="connected">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Connected
            {integrations.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {integrations.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Available Providers Tab */}
        <TabsContent value="providers" className="space-y-6">
          {providersError ? (
            <ErrorAlertView
              title="Failed to load providers"
              message={providersError}
            />
          ) : providersLoading ? (
            <div className="py-20">
              <LoadingSpinnerView size="lg" label="Loading providers..." />
            </div>
          ) : providers.length === 0 ? (
            <EmptyStateView
              icon={<Link2 className="h-12 w-12" />}
              title="No providers available"
              description="Integration providers are not configured."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {providers.map((provider) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  onConnect={() => handleConnect(provider)}
                  isConnecting={isConnecting === provider.id}
                  isConnected={isProviderConnected(provider.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Connected Integrations Tab */}
        <TabsContent value="connected" className="space-y-4">
          {integrationsError ? (
            <ErrorAlertView
              title="Failed to load integrations"
              message={integrationsError}
            />
          ) : integrationsLoading ? (
            <div className="py-20">
              <LoadingSpinnerView size="lg" label="Loading integrations..." />
            </div>
          ) : integrations.length === 0 ? (
            <EmptyStateView
              icon={<Link2Off className="h-12 w-12" />}
              title="No connected integrations"
              description="Connect a data source to import files."
              action={{
                label: 'Browse Sources',
                onClick: () => {
                  const tabButton = document.querySelector('[value="providers"]')
                  if (tabButton instanceof HTMLButtonElement) {
                    tabButton.click()
                  }
                },
              }}
            />
          ) : (
            <div className="space-y-3">
              {integrations.map((integration) => (
                <ConnectedIntegrationCard
                  key={integration.id}
                  integration={integration}
                  onDisconnect={() => onDisconnect(integration.id)}
                  isDisconnecting={isDisconnecting === integration.id}
                  onBrowse={() => onBrowse(integration)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
