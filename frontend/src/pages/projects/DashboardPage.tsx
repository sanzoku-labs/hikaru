import { useParams, useNavigate } from 'react-router-dom'
import { DashboardDetailView } from '@/views/dashboards'
import { useDashboard } from '@/services/api/queries/useDashboard'
import { AnimatedPage } from '@/components/animation'

export default function DashboardPage() {
  const { projectId, dashboardId } = useParams<{ projectId: string; dashboardId: string }>()
  const navigate = useNavigate()

  const numericProjectId = Number(projectId)
  const numericDashboardId = Number(dashboardId)

  const { data, isLoading, error } = useDashboard(numericProjectId, numericDashboardId)

  const handleBack = () => {
    navigate(`/projects/${projectId}`)
  }

  return (
    <AnimatedPage>
      <DashboardDetailView
        dashboard={data}
        isLoading={isLoading}
        error={error?.message || null}
        onBack={handleBack}
      />
    </AnimatedPage>
  )
}
