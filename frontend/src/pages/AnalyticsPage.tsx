import { AnalyticsView } from '@/views/analytics'
import { useAnalytics } from '@/services/api/queries/useAnalytics'

export default function AnalyticsPage() {
  const { data, isLoading, error, refetch } = useAnalytics()

  return (
    <AnalyticsView
      data={data}
      isLoading={isLoading}
      error={error?.message || null}
      onRetry={() => refetch()}
    />
  )
}
