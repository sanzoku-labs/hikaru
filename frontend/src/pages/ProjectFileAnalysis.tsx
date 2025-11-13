import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import type { FileAnalysisResponse } from '../types'
import { Layout } from '../components/Layout'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'
import { Skeleton } from '../components/ui/skeleton'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { AlertCircle, ArrowLeft, BarChart3, Lightbulb, RefreshCw, Download } from 'lucide-react'
import ReactECharts from 'echarts-for-react'
import { ExportModal, ExportOptions } from '../components/charts/ExportModal'

export default function ProjectFileAnalysis() {
  const { projectId, fileId } = useParams<{ projectId: string; fileId: string }>()
  const navigate = useNavigate()

  const [analysis, setAnalysis] = useState<FileAnalysisResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)

  // Re-analyze dialog state
  const [showReanalyzeDialog, setShowReanalyzeDialog] = useState(false)
  const [userIntent, setUserIntent] = useState('')

  // Export modal state
  const [exportModalOpen, setExportModalOpen] = useState(false)

  useEffect(() => {
    loadAnalysis()
  }, [projectId, fileId])

  const loadAnalysis = async () => {
    if (!projectId || !fileId) return

    try {
      setLoading(true)
      setError(null)
      const data = await api.getProjectFileAnalysis(parseInt(projectId), parseInt(fileId))
      setAnalysis(data)
    } catch (err: any) {
      // If no analysis exists, show dialog to create one
      if (err.status === 404 && err.message.includes('No analysis found')) {
        setShowReanalyzeDialog(true)
      } else {
        setError(err.message || 'Failed to load analysis')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyze = async () => {
    if (!projectId || !fileId) return

    try {
      setAnalyzing(true)
      setError(null)
      const data = await api.analyzeProjectFile(
        parseInt(projectId),
        parseInt(fileId),
        userIntent || undefined
      )
      setAnalysis(data)
      setShowReanalyzeDialog(false)
      setUserIntent('')
    } catch (err: any) {
      setError(err.message || 'Failed to analyze file')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleExport = async (options: ExportOptions) => {
    try {
      console.log('Exporting with options:', options)
      // TODO: Implement actual export API call
      // await api.exportAnalysis(parseInt(projectId), parseInt(fileId), options)
      alert('Export functionality will be implemented with backend integration')
      setExportModalOpen(false)
    } catch (err: any) {
      setError(err.message || 'Export failed')
      throw err
    }
  }

  const getChartOption = (chart: any) => {
    const baseOption = {
      tooltip: {
        trigger: 'axis' as const,
        axisPointer: {
          type: 'shadow' as const
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      }
    }

    switch (chart.chart_type) {
      case 'line':
        return {
          ...baseOption,
          xAxis: {
            type: 'category' as const,
            data: chart.data.map((d: any) => d[chart.x_column]),
            name: chart.x_column
          },
          yAxis: {
            type: 'value' as const,
            name: chart.y_column
          },
          series: [{
            data: chart.data.map((d: any) => d[chart.y_column]),
            type: 'line' as const,
            smooth: true
          }]
        }

      case 'bar':
        return {
          ...baseOption,
          xAxis: {
            type: 'category' as const,
            data: chart.data.map((d: any) => d[chart.x_column || chart.category_column]),
            name: chart.x_column || chart.category_column,
            axisLabel: {
              rotate: 45
            }
          },
          yAxis: {
            type: 'value' as const,
            name: chart.y_column || chart.value_column
          },
          series: [{
            data: chart.data.map((d: any) => d[chart.y_column || chart.value_column]),
            type: 'bar' as const
          }]
        }

      case 'pie':
        return {
          tooltip: {
            trigger: 'item' as const,
            formatter: '{a} <br/>{b}: {c} ({d}%)'
          },
          legend: {
            orient: 'vertical' as const,
            left: 'left'
          },
          series: [{
            name: chart.title,
            type: 'pie' as const,
            radius: '50%',
            data: chart.data.map((d: any) => ({
              name: d[chart.category_column],
              value: d[chart.value_column]
            })),
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }]
        }

      case 'scatter':
        return {
          ...baseOption,
          xAxis: {
            type: 'value' as const,
            name: chart.x_column
          },
          yAxis: {
            type: 'value' as const,
            name: chart.y_column
          },
          series: [{
            data: chart.data.map((d: any) => [d[chart.x_column], d[chart.y_column]]),
            type: 'scatter' as const
          }]
        }

      default:
        return baseOption
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </Layout>
    )
  }

  if (error && !showReanalyzeDialog) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={() => navigate(`/projects/${projectId}`)} className="mt-4" variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div>
          <Button onClick={() => navigate(`/projects/${projectId}`)} variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
                <BarChart3 className="h-8 w-8" />
                {analysis?.filename || 'File Analysis'}
              </h1>
              {analysis?.user_intent && (
                <p className="text-muted-foreground">
                  Intent: {analysis.user_intent}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                Analyzed: {analysis?.analyzed_at ? new Date(analysis.analyzed_at).toLocaleString() : 'N/A'}
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setShowReanalyzeDialog(true)} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Re-analyze
              </Button>
              <Button onClick={() => setExportModalOpen(true)} disabled={!analysis}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Global Summary */}
        {analysis?.global_summary && (
          <Alert className="border-primary/30 bg-primary/5">
            <Lightbulb className="h-4 w-4 text-primary" />
            <AlertTitle>AI Summary</AlertTitle>
            <AlertDescription>{analysis.global_summary}</AlertDescription>
          </Alert>
        )}

        {/* Charts Grid */}
        {analysis?.charts && analysis.charts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {analysis.charts.map((chart: any, index: number) => (
              <Card key={index} className="hover:shadow-card-hover transition-shadow">
                <CardHeader>
                  <CardTitle>{chart.title}</CardTitle>
                  {chart.insight && (
                    <CardDescription className="mt-2">
                      <span className="font-semibold text-foreground">Insight:</span>{' '}
                      <span className="text-muted-foreground">{chart.insight}</span>
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <ReactECharts
                    option={getChartOption(chart)}
                    style={{ height: '400px' }}
                    notMerge={true}
                    lazyUpdate={true}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No Charts Generated</p>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                No charts were generated for this file. Try re-analyzing with a different intent.
              </p>
              <Button onClick={() => setShowReanalyzeDialog(true)}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Re-analyze File
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Re-analyze Dialog */}
        <Dialog open={showReanalyzeDialog} onOpenChange={setShowReanalyzeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {analysis ? 'Re-analyze File' : 'Analyze File'}
              </DialogTitle>
              <DialogDescription>
                {analysis
                  ? 'Generate fresh analysis with a new intent or question.'
                  : 'Generate charts and insights for this file.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="intent">Your Intent (Optional)</Label>
                <Input
                  id="intent"
                  placeholder="e.g., Show me sales trends by region..."
                  value={userIntent}
                  onChange={(e) => setUserIntent(e.target.value)}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Describe what you want to understand about this data
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReanalyzeDialog(false)} disabled={analyzing}>
                Cancel
              </Button>
              <Button onClick={handleAnalyze} disabled={analyzing}>
                {analyzing ? 'Analyzing...' : analysis ? 'Re-analyze' : 'Analyze'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Export Modal */}
        <ExportModal
          open={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          onExport={handleExport}
          fileId={fileId ? parseInt(fileId) : undefined}
          projectId={projectId ? parseInt(projectId) : undefined}
          defaultFilename={analysis?.filename.replace(/\.[^/.]+$/, '') || 'analysis'}
        />
      </div>
    </Layout>
  )
}
