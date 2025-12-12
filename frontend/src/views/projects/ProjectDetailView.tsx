import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { formatFileSize, formatDate } from '@/lib/utils'
import {
  Plus,
  FileSpreadsheet,
  GitCompare,
  Merge,
  X,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  MessageSquare,
  ChevronDown,
  Layers,
  LayoutDashboard,
  FolderOpen,
  Grid2X2,
  Trash2,
  Pencil,
} from 'lucide-react'
import { PageHeaderView, EmptyStateView, LoadingSpinnerView, ErrorAlertView } from '@/views/shared'
import { AnalysisFormView, GlobalSummaryView, DataSummaryView } from '@/views/analysis'
import { ChartGridView } from '@/views/charts'
import { ChatPanelView } from '@/views/chat'
import { DashboardsListView } from '@/views/dashboards'
import { ProjectOverviewView } from './ProjectOverviewView'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { ProjectDetailResponse, ProjectFileResponse, FileAnalysisResponse, ChatMessage, DashboardResponse } from '@/types/api'

interface ProjectDetailViewProps {
  // Data
  project: ProjectDetailResponse | null
  isLoading: boolean
  fetchError: string | null

  // Selected file & analysis
  selectedFileId: number | null
  selectedFile: ProjectFileResponse | null
  analysisData: FileAnalysisResponse | null
  isLoadingAnalysis: boolean
  analysisError: string | null

  // Re-analyze state
  showReanalyzeForm: boolean
  reanalyzeIntent: string

  // Upload form state
  showUpload: boolean
  uploadFile: File | null
  uploadIntent: string
  isUploading: boolean
  uploadError: string | null
  canSubmit: boolean

  // Handlers
  onSelectFile: (fileId: number) => void
  onAnalyze: (intent?: string) => void
  onReanalyzeIntentChange: (intent: string) => void
  onToggleReanalyzeForm: () => void
  onToggleUpload: (open?: boolean) => void
  onUploadFileSelect: (file: File) => void
  onUploadFileRemove: () => void
  onUploadIntentChange: (intent: string) => void
  onUploadSubmit: () => void
  onCompareClick: () => void
  onMergeClick: () => void
  onBackClick: () => void

  // Status
  isAnalyzing: boolean

  // Chat
  chatOpen: boolean
  chatMessages: ChatMessage[]
  chatLoading: boolean
  canChat: boolean
  onChatToggle: () => void
  onChatClose: () => void
  onChatSend: (message: string) => void

  // Dashboards
  dashboards: DashboardResponse[]
  isLoadingDashboards: boolean
  onViewDashboard: (dashboardId: number) => void
  onDeleteDashboard: (dashboardId: number) => void
  isDeletingDashboard: number | null | undefined

  // File deletion
  onDeleteFile: (fileId: number) => void
  isDeletingFile: number | null | undefined

  // Project editing
  showEditProject: boolean
  isUpdatingProject: boolean
  onOpenEditProject: () => void
  onCloseEditProject: () => void
  onUpdateProject: (name: string, description: string) => void
}

export function ProjectDetailView({
  project,
  isLoading,
  fetchError,
  selectedFileId,
  selectedFile,
  analysisData,
  isLoadingAnalysis,
  analysisError,
  showReanalyzeForm,
  reanalyzeIntent,
  showUpload,
  uploadFile,
  uploadIntent,
  isUploading,
  uploadError,
  canSubmit,
  onSelectFile,
  onAnalyze,
  onReanalyzeIntentChange,
  onToggleReanalyzeForm,
  onToggleUpload,
  onUploadFileSelect,
  onUploadFileRemove,
  onUploadIntentChange,
  onUploadSubmit,
  onCompareClick,
  onMergeClick,
  onBackClick,
  isAnalyzing,
  // Chat
  chatOpen,
  chatMessages,
  chatLoading,
  canChat,
  onChatToggle,
  onChatClose,
  onChatSend,
  // Dashboards
  dashboards,
  isLoadingDashboards,
  onViewDashboard,
  onDeleteDashboard,
  isDeletingDashboard,
  // File deletion
  onDeleteFile,
  isDeletingFile,
  // Project editing
  showEditProject,
  isUpdatingProject,
  onOpenEditProject,
  onCloseEditProject,
  onUpdateProject,
}: ProjectDetailViewProps) {
  const files = project?.files || []
  const hasMultipleFiles = files.length >= 2
  const hasAnalysis = !!analysisData

  // Edit project form state
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')

  // Sync form when dialog opens
  useEffect(() => {
    if (showEditProject && project) {
      setEditName(project.name)
      setEditDescription(project.description || '')
    }
  }, [showEditProject, project])

  if (isLoading) {
    return (
      <div className="py-20">
        <LoadingSpinnerView size="lg" label="Loading project..." />
      </div>
    )
  }

  if (fetchError || !project) {
    return (
      <ErrorAlertView
        title="Failed to load project"
        message={fetchError || 'Project not found'}
        onRetry={onBackClick}
      />
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <PageHeaderView
        title={project.name}
        description={project.description || 'No description'}
        backButton={{ label: 'Back to Projects', onClick: onBackClick }}
        compact
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenEditProject}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-2 rounded-lg',
                'bg-secondary text-secondary-foreground font-medium text-sm',
                'transition-colors hover:bg-secondary/80'
              )}
              title="Edit project"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
            {hasMultipleFiles && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
                      'bg-secondary text-secondary-foreground font-medium text-sm',
                      'transition-colors hover:bg-secondary/80'
                    )}
                  >
                    <Layers className="h-4 w-4" />
                    Multi-file
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={onCompareClick} className="cursor-pointer">
                    <GitCompare className="h-4 w-4 mr-2" />
                    Compare Files
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onMergeClick} className="cursor-pointer">
                    <Merge className="h-4 w-4 mr-2" />
                    Merge Files
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        }
      />

      {/* Tabs */}
      <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
        <div className="border-b border-border px-0">
          <TabsList className="h-10 bg-transparent p-0 gap-4">
            <TabsTrigger
              value="overview"
              className="relative h-10 rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="files"
              className="relative h-10 rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              Files
              {files.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-muted">
                  {files.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="dashboards"
              className="relative h-10 rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              <Grid2X2 className="h-4 w-4 mr-2" />
              Dashboards
              {dashboards.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-muted">
                  {dashboards.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="flex-1 overflow-y-auto mt-6">
          <ProjectOverviewView
            files={files}
            projectName={project.name}
            projectDescription={project.description || undefined}
            createdAt={project.created_at}
          />
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="flex-1 flex min-h-0 mt-6">
          {/* Split Layout */}
          <div className="flex-1 flex min-h-0">
            {/* Left Panel - File List */}
            <div className="w-72 flex-shrink-0 flex flex-col pr-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              Files ({files.length})
            </h3>
            <Popover open={showUpload} onOpenChange={onToggleUpload}>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm',
                    showUpload
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  )}
                >
                  {showUpload ? (
                    <>
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      Add
                    </>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-96 p-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm">Add File</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload a CSV or Excel file to analyze
                    </p>
                  </div>
                  <AnalysisFormView
                    selectedFile={uploadFile}
                    userIntent={uploadIntent}
                    error={uploadError}
                    canSubmit={canSubmit && !isUploading}
                    onFileSelect={onUploadFileSelect}
                    onFileRemove={onUploadFileRemove}
                    onUserIntentChange={onUploadIntentChange}
                    onSubmit={onUploadSubmit}
                    submitLabel={isUploading ? 'Uploading...' : 'Upload File'}
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Empty state */}
          {files.length === 0 && !showUpload && (
            <div className="flex-1 flex items-center justify-center">
              <EmptyStateView
                icon={<FileSpreadsheet className="h-10 w-10" />}
                title="No files yet"
                description="Add files to start analyzing"
                action={{ label: 'Add File', onClick: onToggleUpload }}
              />
            </div>
          )}

          {/* File List */}
          {files.length > 0 && (
            <div className="flex-1 overflow-y-auto space-y-1.5">
              {files.map((file) => (
                <div
                  key={file.id}
                  onClick={() => onSelectFile(file.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg text-left cursor-pointer group',
                    'transition-all duration-200',
                    selectedFileId === file.id
                      ? 'bg-primary/10 border border-primary/30'
                      : 'bg-card border border-border hover:border-primary/20 hover:bg-muted/50'
                  )}
                >
                  <div
                    className={cn(
                      'p-2 rounded-lg',
                      selectedFileId === file.id
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.file_size)} · {file.data_schema?.row_count?.toLocaleString() || '?'} rows
                    </p>
                  </div>
                  {file.has_analysis && (
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`Delete "${file.filename}"? This cannot be undone.`)) {
                        onDeleteFile(file.id)
                      }
                    }}
                    disabled={isDeletingFile === file.id}
                    className={cn(
                      'p-1.5 rounded-md opacity-0 group-hover:opacity-100',
                      'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
                      'transition-all duration-200',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      isDeletingFile === file.id && 'opacity-100'
                    )}
                    title="Delete file"
                  >
                    {isDeletingFile === file.id ? (
                      <span className="h-4 w-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin block" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vertical Separator */}
        <div className="w-px bg-border flex-shrink-0" />

        {/* Right Panel - Analysis Content */}
        <div className="flex-1 min-w-0 overflow-y-auto pl-6">
          {/* No file selected */}
          {!selectedFile && files.length > 0 && (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground">Select a file to view analysis</p>
            </div>
          )}

          {/* File selected */}
          {selectedFile && (
            <div className="space-y-6 pb-6">
              {/* File header with actions */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{selectedFile.filename}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatFileSize(selectedFile.file_size)} · {selectedFile.data_schema?.row_count?.toLocaleString() || '?'} rows · Uploaded {formatDate(selectedFile.uploaded_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {hasAnalysis && (
                    <>
                      <button
                        onClick={onChatToggle}
                        disabled={!canChat}
                        className={cn(
                          'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
                          'bg-secondary text-secondary-foreground font-medium text-sm',
                          'transition-colors hover:bg-secondary/80',
                          'disabled:opacity-50 disabled:cursor-not-allowed'
                        )}
                      >
                        <MessageSquare className="h-4 w-4" />
                        Ask AI
                      </button>
                      <button
                        onClick={onToggleReanalyzeForm}
                        disabled={isAnalyzing}
                        className={cn(
                          'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
                          'bg-secondary text-secondary-foreground font-medium text-sm',
                          'transition-colors hover:bg-secondary/80',
                          'disabled:opacity-50 disabled:cursor-not-allowed'
                        )}
                      >
                        {showReanalyzeForm ? (
                          <>
                            <X className="h-4 w-4" />
                            Cancel
                          </>
                        ) : (
                          <>
                            <RotateCcw className="h-4 w-4" />
                            Re-analyze
                          </>
                        )}
                      </button>
                    </>
                  )}
                  {!hasAnalysis && (
                    <button
                      onClick={() => onAnalyze()}
                      disabled={isAnalyzing}
                      className={cn(
                        'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
                        'bg-primary text-primary-foreground font-medium text-sm',
                        'transition-all duration-200',
                        'hover:bg-primary/90',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                    >
                      {isAnalyzing ? (
                        <>
                          <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          Analyze File
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Re-analyze form */}
              {showReanalyzeForm && (
                <div className="p-6 rounded-xl border bg-card animate-in-up">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reanalyze-intent" className="text-sm font-medium">
                        What would you like to learn from this data?
                        <span className="text-muted-foreground font-normal ml-1">(optional)</span>
                      </Label>
                      <Textarea
                        id="reanalyze-intent"
                        placeholder="e.g., Focus on trends over time, or Compare categories..."
                        value={reanalyzeIntent}
                        onChange={(e) => onReanalyzeIntentChange(e.target.value)}
                        className="min-h-[80px] resize-none"
                      />
                    </div>
                    <button
                      onClick={() => onAnalyze()}
                      disabled={isAnalyzing}
                      className={cn(
                        'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
                        'bg-primary text-primary-foreground font-medium text-sm',
                        'transition-all duration-200',
                        'hover:bg-primary/90',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                    >
                      {isAnalyzing ? (
                        <>
                          <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Run Analysis
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Analysis error */}
              {analysisError && (
                <ErrorAlertView
                  title="Analysis failed"
                  message={analysisError}
                  onRetry={() => onAnalyze()}
                />
              )}

              {/* Loading analysis */}
              {isLoadingAnalysis && (
                <div className="py-12">
                  <LoadingSpinnerView size="lg" label="Loading analysis..." />
                </div>
              )}

              {/* Analyzing state */}
              {isAnalyzing && !showReanalyzeForm && (
                <div className="py-12">
                  <LoadingSpinnerView size="lg" label="Analyzing your data and generating insights..." />
                </div>
              )}

              {/* No analysis yet */}
              {!hasAnalysis && !isAnalyzing && !isLoadingAnalysis && (
                <div className="py-12 text-center">
                  <div className="inline-flex p-4 rounded-2xl bg-muted/50 text-muted-foreground mb-4">
                    <FileSpreadsheet className="h-12 w-12" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Ready to analyze
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Click "Analyze File" to generate charts and AI-powered insights from your data.
                  </p>
                </div>
              )}

              {/* Analysis results */}
              {hasAnalysis && !showReanalyzeForm && !isLoadingAnalysis && (
                <div className="space-y-8">
                  {/* Global AI Summary */}
                  {analysisData.global_summary && (
                    <GlobalSummaryView summary={analysisData.global_summary} />
                  )}

                  {/* Data summary (collapsed by default) */}
                  {selectedFile.data_schema && (
                    <DataSummaryView
                      fileName={selectedFile.filename}
                      dataSchema={selectedFile.data_schema}
                    />
                  )}

                  {/* Charts grid */}
                  {analysisData.charts && analysisData.charts.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-6">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold text-foreground">
                          Generated Charts
                        </h3>
                        <span className="text-sm text-muted-foreground">
                          ({analysisData.charts.length} charts)
                        </span>
                      </div>
                      <ChartGridView charts={analysisData.charts} fileId={selectedFile.id} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </TabsContent>

        {/* Dashboards Tab */}
        <TabsContent value="dashboards" className="flex-1 overflow-y-auto mt-6">
          <DashboardsListView
            dashboards={dashboards}
            isLoading={isLoadingDashboards}
            onView={onViewDashboard}
            onDelete={onDeleteDashboard}
            isDeleting={isDeletingDashboard}
          />
        </TabsContent>
      </Tabs>

      {/* Chat Panel */}
      <ChatPanelView
        isOpen={chatOpen}
        onClose={onChatClose}
        messages={chatMessages}
        onSendMessage={onChatSend}
        isLoading={chatLoading}
        disabled={!canChat}
      />

      {/* Edit Project Dialog */}
      <Dialog open={showEditProject} onOpenChange={(open) => !open && onCloseEditProject()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update your project's name and description.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Project name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Optional description"
                className="min-h-[80px] resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={onCloseEditProject}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium',
                'bg-secondary text-secondary-foreground',
                'hover:bg-secondary/80 transition-colors'
              )}
            >
              Cancel
            </button>
            <button
              onClick={() => onUpdateProject(editName, editDescription)}
              disabled={isUpdatingProject || !editName.trim()}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
                'bg-primary text-primary-foreground',
                'hover:bg-primary/90 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isUpdatingProject ? (
                <>
                  <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
