import { AnalyticsView } from '@/views/analytics'
import { useAnalytics } from '@/services/api/queries/useAnalytics'
import { AnimatedPage } from '@/components/animation'

export default function AnalyticsPage() {
  const { data, isLoading, error, refetch } = useAnalytics()

  return (
    <AnimatedPage>
      <AnalyticsView
        data={data}
        isLoading={isLoading}
        error={error?.message || null}
        onRetry={() => refetch()}
      />
    </AnimatedPage>
  )
}
