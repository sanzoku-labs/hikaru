/**
 * Comparisons - File comparison center (Mockup 4)
 *
 * Features:
 * - List of saved comparisons
 * - Start new comparison wizard
 * - Quick comparison filters
 * - Comparison result previews
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { ComparisonWizard } from '@/components/comparison/ComparisonWizard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  GitCompare,
  Plus,
  TrendingUp,
  Calendar,
  Eye,
  Trash2,
  FileText,
  Clock
} from 'lucide-react'

interface Comparison {
  id: string
  project_id: number
  project_name: string
  file_a_name: string
  file_b_name: string
  comparison_type: 'trend' | 'yoy' | 'side_by_side'
  charts_count: number
  created_at: string
}

const comparisonTypeLabels = {
  trend: 'Trend Analysis',
  yoy: 'Year-over-Year',
  side_by_side: 'Side-by-Side'
}

const comparisonTypeIcons = {
  trend: TrendingUp,
  yoy: Calendar,
  side_by_side: GitCompare
}

export function Comparisons() {
  const navigate = useNavigate()
  const [comparisons, setComparisons] = useState<Comparison[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [wizardOpen, setWizardOpen] = useState(false)

  // Mock project files for wizard (in real app, fetch from selected project)
  const mockFiles = [
    {
      id: 1,
      filename: 'Q1_2024_Sales.csv',
      file_size: 245678,
      row_count: 1250,
      uploaded_at: new Date().toISOString()
    },
    {
      id: 2,
      filename: 'Q2_2024_Sales.csv',
      file_size: 287432,
      row_count: 1480,
      uploaded_at: new Date().toISOString()
    }
  ]

  useEffect(() => {
    loadComparisons()
  }, [])

  const loadComparisons = async () => {
    try {
      setLoading(true)
      setError(null)

      // TODO: Replace with actual API call
      // Simulating API response
      await new Promise(resolve => setTimeout(resolve, 600))

      setComparisons([])
    } catch (err: any) {
      setError(err.message || 'Failed to load comparisons')
    } finally {
      setLoading(false)
    }
  }

  const handleStartComparison = async (fileAId: number, fileBId: number, comparisonType: string) => {
    try {
      // TODO: Call comparison API
      console.log('Starting comparison:', { fileAId, fileBId, comparisonType })

      // Close wizard
      setWizardOpen(false)

      // TODO: Navigate to comparison result page
      // navigate(`/comparisons/${comparisonId}`)
    } catch (err) {
      console.error('Failed to start comparison:', err)
    }
  }

  const handleViewComparison = (comparisonId: string) => {
    // TODO: Navigate to comparison detail page
    navigate(`/comparisons/${comparisonId}`)
  }

  const handleDeleteComparison = async (comparisonId: string) => {
    if (!confirm('Delete this comparison? This action cannot be undone.')) return

    try {
      // TODO: Call delete API
      setComparisons(comparisons.filter(c => c.id !== comparisonId))
    } catch (err) {
      console.error('Failed to delete comparison:', err)
    }
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Comparisons</h1>
            <p className="text-muted-foreground">
              Compare files side-by-side to identify trends and differences
            </p>
          </div>
          <Button onClick={() => setWizardOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Comparison
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-2/3 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : comparisons.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="p-4 rounded-full bg-primary/10 mb-4">
              <GitCompare className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No Comparisons Yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Start comparing files to identify trends, analyze changes over time, and discover insights
              across datasets
            </p>
            <Button onClick={() => setWizardOpen(true)} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Comparison
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {comparisons.map((comparison) => {
              const Icon = comparisonTypeIcons[comparison.comparison_type]

              return (
                <Card
                  key={comparison.id}
                  className="hover:shadow-card-hover transition-shadow group"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-shrink-0 p-2.5 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {comparisonTypeLabels[comparison.comparison_type]}
                      </Badge>
                    </div>

                    <CardTitle className="text-base mb-2">
                      {comparison.project_name}
                    </CardTitle>

                    <CardDescription className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs">
                        <FileText className="h-3 w-3" />
                        <span className="truncate">{comparison.file_a_name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <GitCompare className="h-3 w-3" />
                        <span className="truncate">{comparison.file_b_name}</span>
                      </div>
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(comparison.created_at)}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {comparison.charts_count} charts
                      </Badge>
                    </div>

                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleViewComparison(comparison.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteComparison(comparison.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Comparison Wizard Dialog */}
      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Comparison</DialogTitle>
          </DialogHeader>
          <ComparisonWizard
            files={mockFiles}
            onComplete={handleStartComparison}
            onCancel={() => setWizardOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Layout>
  )
}
