import { useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useCompleteOAuth } from '@/services/api/mutations/useConnectIntegration'
import { LoadingSpinnerView } from '@/views/shared'

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const completeOAuth = useCompleteOAuth()
  const processed = useRef(false)

  useEffect(() => {
    if (processed.current) return
    processed.current = true

    const code = searchParams.get('code')
    const state = searchParams.get('state')

    const storedState = sessionStorage.getItem('oauth_state')
    const provider = sessionStorage.getItem('oauth_provider')
    const redirectUri = sessionStorage.getItem('oauth_redirect_uri')

    // Clean up sessionStorage
    sessionStorage.removeItem('oauth_state')
    sessionStorage.removeItem('oauth_provider')
    sessionStorage.removeItem('oauth_redirect_uri')

    if (!code || !state || !provider || !redirectUri) {
      toast.error('Invalid OAuth callback. Missing parameters.')
      navigate('/integrations', { replace: true })
      return
    }

    if (state !== storedState) {
      toast.error('OAuth state mismatch. Please try connecting again.')
      navigate('/integrations', { replace: true })
      return
    }

    completeOAuth.mutate(
      { provider, code, state, redirectUri },
      {
        onSuccess: () => {
          navigate('/integrations', { replace: true })
        },
        onError: () => {
          navigate('/integrations', { replace: true })
        },
      }
    )
  }, [searchParams, navigate, completeOAuth])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <LoadingSpinnerView size="lg" label="Completing connection..." />
    </div>
  )
}
