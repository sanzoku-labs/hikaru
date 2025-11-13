/**
 * Merging - File merging center (Mockup 5)
 *
 * Features:
 * - List of saved merges
 * - Start new merge wizard
 * - Merge result previews
 * - Download merged files
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { MergeWizard } from '@/components/merging/MergeWizard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  GitMerge,
  Plus,
  Key,
  Eye,
  Download,
  Trash2,
  FileText,
  Clock
} from 'lucide-react'

interface Merge {
  id: string
  project_id: number
  project_name: string
  file_a_name: string
  file_b_name: string
  join_key: string
  merge_type: 'inner' | 'left' | 'right' | 'outer'
  result_row_count: number
  created_at: string
}

const mergeTypeLabels = {
  inner: 'Inner Join',
  left: 'Left Join',
  right: 'Right Join',
  outer: 'Full Outer Join'
}

export function Merging() {
  const navigate = useNavigate()
  const [merges, setMerges] = useState<Merge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [wizardOpen, setWizardOpen] = useState(false)

  // Mock project files for wizard (in real app, fetch from selected project)
  const mockFiles = [
    {
      id: 1,
      filename: 'customers.csv',
      file_size: 145678,
      row_count: 850,
      columns: ['customer_id', 'name', 'email', 'region'],
      uploaded_at: new Date().toISOString()
    },
    {
      id: 2,
      filename: 'orders.csv',
      file_size: 287432,
      row_count: 2150,
      columns: ['order_id', 'customer_id', 'amount', 'date'],
      uploaded_at: new Date().toISOString()
    }
  ]

  useEffect(() => {
    loadMerges()
  }, [])

  const loadMerges = async () => {
    try {
      setLoading(true)
      setError(null)

      // TODO: Replace with actual API call
      // Simulating API response
      await new Promise(resolve => setTimeout(resolve, 600))

      setMerges([])
    } catch (err: any) {
      setError(err.message || 'Failed to load merges')
    } finally {
      setLoading(false)
    }
  }

  const handleStartMerge = async (
    fileAId: number,
    fileBId: number,
    joinKey: string,
    mergeType: string
  ) => {
    try {
      // TODO: Call merge API
      console.log('Starting merge:', { fileAId, fileBId, joinKey, mergeType })

      // Close wizard
      setWizardOpen(false)

      // TODO: Navigate to merge result page or add to list
      // navigate(`/merging/${mergeId}`)
    } catch (err) {
      console.error('Failed to start merge:', err)
    }
  }

  const handleViewMerge = (mergeId: string) => {
    // TODO: Navigate to merge detail/preview page
    navigate(`/merging/${mergeId}`)
  }

  const handleDownloadMerge = async (mergeId: string) => {
    try {
      // TODO: Call download API
      console.log('Downloading merge:', mergeId)
    } catch (err) {
      console.error('Failed to download merge:', err)
    }
  }

  const handleDeleteMerge = async (mergeId: string) => {
    if (!confirm('Delete this merge? This action cannot be undone.')) return

    try {
      // TODO: Call delete API
      setMerges(merges.filter(m => m.id !== mergeId))
    } catch (err) {
      console.error('Failed to delete merge:', err)
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
            <h1 className="text-3xl font-bold mb-2">Merging</h1>
            <p className="text-muted-foreground">
              Combine multiple data files using SQL-like joins
            </p>
          </div>
          <Button onClick={() => setWizardOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Merge
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
        ) : merges.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="p-4 rounded-full bg-primary/10 mb-4">
              <GitMerge className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No Merges Yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Merge multiple files using joins to create enriched datasets for comprehensive analysis
            </p>
            <Button onClick={() => setWizardOpen(true)} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Merge
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {merges.map((merge) => (
              <Card
                key={merge.id}
                className="hover:shadow-card-hover transition-shadow group"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-shrink-0 p-2.5 rounded-lg bg-primary/10">
                      <GitMerge className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {mergeTypeLabels[merge.merge_type]}
                    </Badge>
                  </div>

                  <CardTitle className="text-base mb-2">
                    {merge.project_name}
                  </CardTitle>

                  <CardDescription className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs">
                      <FileText className="h-3 w-3" />
                      <span className="truncate">{merge.file_a_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <GitMerge className="h-3 w-3" />
                      <span className="truncate">{merge.file_b_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-primary">
                      <Key className="h-3 w-3" />
                      <span className="font-medium">Join: {merge.join_key}</span>
                    </div>
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(merge.created_at)}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {merge.result_row_count.toLocaleString()} rows
                    </Badge>
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewMerge(merge.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadMerge(merge.id)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteMerge(merge.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Merge Wizard Dialog */}
      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Merge</DialogTitle>
          </DialogHeader>
          <MergeWizard
            files={mockFiles}
            onComplete={handleStartMerge}
            onCancel={() => setWizardOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Layout>
  )
}
