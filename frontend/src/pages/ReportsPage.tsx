import { useCallback } from 'react'
import { ENDPOINTS } from '@/services/endpoints'
import { ReportsView } from '@/views/reports'
import { AnimatedPage } from '@/components/animation'
import { useReportTemplates } from '@/services/api/queries/useReportTemplates'
import { useReports } from '@/services/api/queries/useReports'
import { useGenerateReport } from '@/services/api/mutations/useGenerateReport'
import { useDeleteReport } from '@/services/api/mutations/useDeleteReport'
import type { GeneratedReport } from '@/types/api'

export function ReportsPage() {
  // Fetch templates and reports
  const {
    data: templatesData,
    isLoading: templatesLoading,
    error: templatesError,
  } = useReportTemplates()

  const {
    data: reportsData,
    isLoading: reportsLoading,
    error: reportsError,
  } = useReports()

  // Mutations
  const generateReport = useGenerateReport()
  const deleteReport = useDeleteReport()

  // Handle report generation
  const handleGenerate = useCallback(
    (config: {
      template_id: string
      project_id?: number
      title?: string
      include_raw_data: boolean
    }) => {
      generateReport.mutate(config)
    },
    [generateReport]
  )

  // Handle download - opens download URL in new tab
  const handleDownload = useCallback((report: GeneratedReport) => {
    // Construct the full download URL
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
    const downloadUrl = `${baseUrl}${ENDPOINTS.REPORTS.DOWNLOAD(report.report_id)}`

    // Get token for authenticated download
    const token = localStorage.getItem('token')

    // Create a temporary link with auth header via fetch
    fetch(downloadUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${report.title.replace(/\s+/g, '_')}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      })
  }, [])

  // Handle delete
  const handleDelete = useCallback(
    (reportId: string) => {
      deleteReport.mutate(reportId)
    },
    [deleteReport]
  )

  return (
    <AnimatedPage>
      <ReportsView
        templates={templatesData?.templates || []}
        templatesLoading={templatesLoading}
        templatesError={templatesError?.message || null}
        reports={reportsData?.reports || []}
        reportsLoading={reportsLoading}
        reportsError={reportsError?.message || null}
        onGenerate={handleGenerate}
        isGenerating={generateReport.isPending}
        onDownload={handleDownload}
        onDelete={handleDelete}
        isDeleting={deleteReport.isPending ? deleteReport.variables || null : null}
      />
    </AnimatedPage>
  )
}
