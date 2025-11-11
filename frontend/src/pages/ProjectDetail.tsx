import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '@/services/api'
import type {
  ProjectResponse,
  FileInProject,
  ComparisonRequest,
  ComparisonResponse,
  RelationshipCreate,
  RelationshipResponse,
  MergeAnalyzeResponse
} from '@/types'
import { Layout } from '@/components/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Upload,
  FileText,
  Trash2,
  GitCompare,
  GitMerge,
  Calendar,
  X,
} from 'lucide-react'
import { ChartGrid } from '@/components/ChartGrid'
import { GlobalSummary } from '@/components/GlobalSummary'

type ViewMode = 'files' | 'comparison' | 'merge'

export function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()

  const [project, setProject] = useState<ProjectResponse | null>(null)
  const [files, setFiles] = useState<FileInProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [viewMode, setViewMode] = useState<ViewMode>('files')

  // Comparison state
  const [selectedFileA, setSelectedFileA] = useState<number | null>(null)
  const [selectedFileB, setSelectedFileB] = useState<number | null>(null)
  const [comparisonType, setComparisonType] = useState<'trend' | 'yoy' | 'side_by_side'>('side_by_side')
  const [comparisonData, setComparisonData] = useState<ComparisonResponse | null>(null)
  const [comparing, setComparing] = useState(false)

  // Merge state
  const [mergeFileA, setMergeFileA] = useState<number | null>(null)
  const [mergeFileB, setMergeFileB] = useState<number | null>(null)
  const [joinType, setJoinType] = useState<'inner' | 'left' | 'right' | 'outer'>('inner')
  const [leftKey, setLeftKey] = useState('')
  const [rightKey, setRightKey] = useState('')
  const [relationships, setRelationships] = useState<RelationshipResponse[]>([])
  const [mergeResult, setMergeResult] = useState<MergeAnalyzeResponse | null>(null)
  const [merging, setMerging] = useState(false)

  useEffect(() => {
    if (projectId) {
      loadProjectData()
    }
  }, [projectId])

  const loadProjectData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [projectRes, filesRes, relationshipsRes] = await Promise.all([
        api.getProject(Number(projectId)),
        api.listProjectFiles(Number(projectId)),
        api.listRelationships(Number(projectId)),
      ])
      setProject(projectRes)
      setFiles(filesRes)
      setRelationships(relationshipsRes)
    } catch (err: any) {
      setError(err.message || 'Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !projectId) return

    try {
      setUploading(true)
      await api.uploadFileToProject(Number(projectId), file)
      await loadProjectData()
      setUploadDialogOpen(false)
    } catch (err: any) {
      setError(err.message || 'File upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteFile = async (fileId: number) => {
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      await api.deleteProjectFile(Number(projectId), fileId)
      await loadProjectData()
    } catch (err: any) {
      setError(err.message || 'Failed to delete file')
    }
  }

  const handleCompare = async () => {
    if (!selectedFileA || !selectedFileB || !projectId) return

    try {
      setComparing(true)
      setError(null)
      const request: ComparisonRequest = {
        file_a_id: selectedFileA,
        file_b_id: selectedFileB,
        comparison_type: comparisonType,
      }
      const result = await api.compareFiles(Number(projectId), request)
      setComparisonData(result)
    } catch (err: any) {
      setError(err.message || 'Comparison failed')
    } finally {
      setComparing(false)
    }
  }

  const handleCreateMerge = async () => {
    if (!mergeFileA || !mergeFileB || !leftKey || !rightKey || !projectId) return

    try {
      setMerging(true)
      setError(null)
      const request: RelationshipCreate = {
        file_a_id: mergeFileA,
        file_b_id: mergeFileB,
        join_type: joinType,
        left_key: leftKey,
        right_key: rightKey,
        left_suffix: '_a',
        right_suffix: '_b',
      }
      const relationship = await api.createRelationship(Number(projectId), request)

      // Analyze merged data
      const mergeAnalysis = await api.analyzeMergedData(Number(projectId), {
        relationship_id: relationship.id,
      })
      setMergeResult(mergeAnalysis)
      await loadProjectData()
    } catch (err: any) {
      setError(err.message || 'Merge failed')
    } finally {
      setMerging(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        </div>
      </Layout>
    )
  }

  if (!project) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>Project not found</AlertDescription>
        </Alert>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/projects')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
            {project.description && (
              <p className="text-muted-foreground">{project.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {files.length} files
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Created {formatDate(project.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            {error}
            <Button
              variant="ghost"
              size="sm"
              className="ml-2"
              onClick={() => setError(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* View Mode Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={viewMode === 'files' ? 'default' : 'outline'}
          onClick={() => setViewMode('files')}
        >
          <FileText className="h-4 w-4 mr-2" />
          Files ({files.length})
        </Button>
        <Button
          variant={viewMode === 'comparison' ? 'default' : 'outline'}
          onClick={() => setViewMode('comparison')}
          disabled={files.length < 2}
        >
          <GitCompare className="h-4 w-4 mr-2" />
          Compare Files
        </Button>
        <Button
          variant={viewMode === 'merge' ? 'default' : 'outline'}
          onClick={() => setViewMode('merge')}
          disabled={files.length < 2}
        >
          <GitMerge className="h-4 w-4 mr-2" />
          Merge Files
        </Button>
      </div>

      {/* Files View */}
      {viewMode === 'files' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Files</h2>
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </Button>
          </div>

          {files.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No files uploaded yet</p>
                <Button onClick={() => setUploadDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Your First File
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {files.map((file) => (
                <Card key={file.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{file.filename}</CardTitle>
                        <CardDescription className="mt-1">
                          <div className="flex items-center gap-4 text-sm">
                            <span>{formatFileSize(file.file_size)}</span>
                            <span>{file.row_count?.toLocaleString() || 0} rows</span>
                            <span>{formatDate(file.uploaded_at)}</span>
                          </div>
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFile(file.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Comparison View */}
      {viewMode === 'comparison' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compare Two Files</CardTitle>
              <CardDescription>
                Select two files to compare and generate overlay charts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First File</Label>
                  <select
                    className="w-full p-2 border rounded"
                    value={selectedFileA || ''}
                    onChange={(e) => setSelectedFileA(Number(e.target.value))}
                  >
                    <option value="">Select file...</option>
                    {files.map((file) => (
                      <option key={file.id} value={file.id}>
                        {file.filename}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Second File</Label>
                  <select
                    className="w-full p-2 border rounded"
                    value={selectedFileB || ''}
                    onChange={(e) => setSelectedFileB(Number(e.target.value))}
                  >
                    <option value="">Select file...</option>
                    {files.map((file) => (
                      <option key={file.id} value={file.id} disabled={file.id === selectedFileA}>
                        {file.filename}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Comparison Type</Label>
                <div className="flex gap-2">
                  <Button
                    variant={comparisonType === 'side_by_side' ? 'default' : 'outline'}
                    onClick={() => setComparisonType('side_by_side')}
                    size="sm"
                  >
                    Side by Side
                  </Button>
                  <Button
                    variant={comparisonType === 'trend' ? 'default' : 'outline'}
                    onClick={() => setComparisonType('trend')}
                    size="sm"
                  >
                    Trend Analysis
                  </Button>
                  <Button
                    variant={comparisonType === 'yoy' ? 'default' : 'outline'}
                    onClick={() => setComparisonType('yoy')}
                    size="sm"
                  >
                    Year-over-Year
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleCompare}
                disabled={!selectedFileA || !selectedFileB || comparing}
                className="w-full"
              >
                {comparing ? 'Comparing...' : 'Compare Files'}
              </Button>
            </CardContent>
          </Card>

          {comparisonData && (
            <div className="space-y-6">
              <GlobalSummary summary={comparisonData.summary_insight} />
              <div>
                <h3 className="text-xl font-semibold mb-4">Overlay Charts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {comparisonData.overlay_charts.map((chart, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-lg">{chart.title}</CardTitle>
                        <div className="flex gap-2">
                          <Badge variant="secondary">{chart.file_a_name}</Badge>
                          <Badge variant="outline">{chart.file_b_name}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {chart.comparison_insight && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {chart.comparison_insight}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Merge View */}
      {viewMode === 'merge' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Merge Two Files</CardTitle>
              <CardDescription>
                Perform SQL-like joins to combine data from two files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Left File</Label>
                  <select
                    className="w-full p-2 border rounded"
                    value={mergeFileA || ''}
                    onChange={(e) => setMergeFileA(Number(e.target.value))}
                  >
                    <option value="">Select file...</option>
                    {files.map((file) => (
                      <option key={file.id} value={file.id}>
                        {file.filename}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Right File</Label>
                  <select
                    className="w-full p-2 border rounded"
                    value={mergeFileB || ''}
                    onChange={(e) => setMergeFileB(Number(e.target.value))}
                  >
                    <option value="">Select file...</option>
                    {files.map((file) => (
                      <option key={file.id} value={file.id} disabled={file.id === mergeFileA}>
                        {file.filename}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Left Join Key</Label>
                  <Input
                    placeholder="e.g., customer_id"
                    value={leftKey}
                    onChange={(e) => setLeftKey(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Right Join Key</Label>
                  <Input
                    placeholder="e.g., customer_id"
                    value={rightKey}
                    onChange={(e) => setRightKey(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Join Type</Label>
                <div className="flex gap-2">
                  {(['inner', 'left', 'right', 'outer'] as const).map((type) => (
                    <Button
                      key={type}
                      variant={joinType === type ? 'default' : 'outline'}
                      onClick={() => setJoinType(type)}
                      size="sm"
                    >
                      {type.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleCreateMerge}
                disabled={!mergeFileA || !mergeFileB || !leftKey || !rightKey || merging}
                className="w-full"
              >
                {merging ? 'Merging...' : 'Merge and Analyze'}
              </Button>
            </CardContent>
          </Card>

          {mergeResult && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Merged Data Summary</CardTitle>
                  <CardDescription>
                    {mergeResult.merged_row_count.toLocaleString()} rows in merged dataset
                  </CardDescription>
                </CardHeader>
              </Card>

              {mergeResult.global_summary && (
                <GlobalSummary summary={mergeResult.global_summary} />
              )}

              <div>
                <h3 className="text-xl font-semibold mb-4">Analysis of Merged Data</h3>
                <ChartGrid charts={mergeResult.charts} loading={false} />
              </div>
            </div>
          )}

          {relationships.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Existing Merges</h3>
              <div className="space-y-2">
                {relationships.map((rel) => (
                  <Card key={rel.id}>
                    <CardContent className="py-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">
                            Merge #{rel.id} - {rel.relationship_type.toUpperCase()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Created {formatDate(rel.created_at)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            if (confirm('Delete this merge relationship?')) {
                              await api.deleteRelationship(Number(projectId), rel.id)
                              await loadProjectData()
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload File to Project</DialogTitle>
            <DialogDescription>
              Upload a CSV or Excel file to add to this project
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            {uploading && <p className="text-sm text-muted-foreground mt-2">Uploading...</p>}
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </Layout>
  )
}
