/**
 * Analytics - Cross-project analytics dashboard (Mockup 3)
 *
 * Features:
 * - KPI cards (total projects, files, analyses)
 * - Activity timeline
 * - Top insights across all projects
 * - Chart type distribution
 * - Recent analyses with quick access
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { StatCard } from '@/components/shared/StatCard'
import { AnalysisCard } from '@/components/projects/AnalysisCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  FolderOpen,
  FileText,
  BarChart3,
  PieChart,
  LineChart,
  ScatterChart,
  Lightbulb
} from 'lucide-react'

interface AnalyticsData {
  total_projects: number
  total_files: number
  total_analyses: number
  projects_trend: number
  files_trend: number
  analyses_trend: number
  recent_analyses: Array<{
    analysis_id: string
    file_id: number
    project_id: number
    project_name: string
    filename: string
    charts_count: number
    user_intent?: string
    analyzed_at: string
    has_global_summary: boolean
  }>
  chart_type_distribution: {
    line: number
    bar: number
    pie: number
    scatter: number
  }
  top_insights: Array<{
    id: string
    project_name: string
    filename: string
    insight: string
    confidence: number
    analyzed_at: string
  }>
}

export function Analytics() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      // TODO: Replace with actual API call
      // Simulating API response
      await new Promise(resolve => setTimeout(resolve, 800))

      setData({
        total_projects: 12,
        total_files: 47,
        total_analyses: 89,
        projects_trend: 15.2,
        files_trend: 23.5,
        analyses_trend: 31.8,
        recent_analyses: [],
        chart_type_distribution: {
          line: 35,
          bar: 28,
          pie: 22,
          scatter: 15
        },
        top_insights: []
      })
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const handleLoadAnalysis = (projectId: number, fileId: number, analysisId: string) => {
    navigate(`/projects/${projectId}/files/${fileId}/analysis/${analysisId}`)
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics</h1>
          <p className="text-muted-foreground">
            Cross-project insights and performance metrics
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* KPI Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-12 w-12 rounded-lg mb-4" />
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : data ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              label="Total Projects"
              value={data.total_projects}
              icon={FolderOpen}
              trend={{
                value: data.projects_trend,
                direction: data.projects_trend > 0 ? 'up' : 'down'
              }}
              iconColor="text-primary"
              iconBgColor="bg-primary/10"
            />
            <StatCard
              label="Total Files"
              value={data.total_files}
              icon={FileText}
              trend={{
                value: data.files_trend,
                direction: data.files_trend > 0 ? 'up' : 'down'
              }}
              iconColor="text-chart-green"
              iconBgColor="bg-chart-green/10"
            />
            <StatCard
              label="Total Analyses"
              value={data.total_analyses}
              icon={BarChart3}
              trend={{
                value: data.analyses_trend,
                direction: data.analyses_trend > 0 ? 'up' : 'down'
              }}
              iconColor="text-chart-purple"
              iconBgColor="bg-chart-purple/10"
            />
          </div>
        ) : null}

        {/* Chart Type Distribution */}
        {!loading && data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Chart Type Distribution</CardTitle>
                <CardDescription>Most commonly generated chart types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <LineChart className="h-4 w-4 text-chart-blue" />
                        <span className="text-sm font-medium">Line Charts</span>
                      </div>
                      <span className="text-sm font-bold">{data.chart_type_distribution.line}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-chart-blue transition-all"
                        style={{ width: `${data.chart_type_distribution.line}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-chart-green" />
                        <span className="text-sm font-medium">Bar Charts</span>
                      </div>
                      <span className="text-sm font-bold">{data.chart_type_distribution.bar}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-chart-green transition-all"
                        style={{ width: `${data.chart_type_distribution.bar}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <PieChart className="h-4 w-4 text-chart-orange" />
                        <span className="text-sm font-medium">Pie Charts</span>
                      </div>
                      <span className="text-sm font-bold">{data.chart_type_distribution.pie}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-chart-orange transition-all"
                        style={{ width: `${data.chart_type_distribution.pie}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ScatterChart className="h-4 w-4 text-chart-purple" />
                        <span className="text-sm font-medium">Scatter Plots</span>
                      </div>
                      <span className="text-sm font-bold">{data.chart_type_distribution.scatter}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-chart-purple transition-all"
                        style={{ width: `${data.chart_type_distribution.scatter}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Insights Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Top Insights
                </CardTitle>
                <CardDescription>Most impactful AI-generated insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center min-h-[200px] text-center">
                  <Lightbulb className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Top insights will appear here as you analyze more files
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Analyses */}
        {!loading && data && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent Analyses</h2>
              <Badge variant="secondary">
                {data.recent_analyses.length} analyses
              </Badge>
            </div>

            {data.recent_analyses.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center min-h-[200px] text-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mb-3" />
                  <h3 className="font-medium mb-1">No Analyses Yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Start analyzing files in your projects to see insights and charts here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.recent_analyses.map((analysis) => (
                  <AnalysisCard
                    key={analysis.analysis_id}
                    analysis={analysis}
                    onLoad={() => handleLoadAnalysis(analysis.project_id, analysis.file_id, analysis.analysis_id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
