import { useState } from 'react'
import {
  GitCompare,
  Merge,
  ChevronDown,
  Layers,
  LayoutDashboard,
  FolderOpen,
  Grid2X2,
  Pencil,
} from 'lucide-react'
import { PageHeaderView, LoadingSpinnerView, ErrorAlertView } from '@/views/shared'
import { ChatPanelView } from '@/views/chat'
import { DashboardsListView } from '@/views/dashboards'
import { ProjectOverviewView } from './ProjectOverviewView'
import { FileListPanel } from './FileListPanel'
import { FileAnalysisPanel } from './FileAnalysisPanel'
import { EditProjectDialog } from './EditProjectDialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AnimatedTabContent } from '@/components/animation'
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
  chatOpen,
  chatMessages,
  chatLoading,
  canChat,
  onChatToggle,
  onChatClose,
  onChatSend,
  dashboards,
  isLoadingDashboards,
  onViewDashboard,
  onDeleteDashboard,
  isDeletingDashboard,
  onDeleteFile,
  isDeletingFile,
  showEditProject,
  isUpdatingProject,
  onOpenEditProject,
  onCloseEditProject,
  onUpdateProject,
}: ProjectDetailViewProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const files = project?.files || []
  const hasMultipleFiles = files.length >= 2
  const hasAnalysis = !!analysisData

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
            <Button
              variant="secondary"
              onClick={onOpenEditProject}
              title="Edit project"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            {hasMultipleFiles && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary">
                    <Layers className="h-4 w-4" />
                    Multi-file
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
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

        <AnimatedTabContent activeTab={activeTab} className="flex-1 mt-6 min-h-0">
          {activeTab === 'overview' && (
            <ProjectOverviewView
              files={files}
              projectName={project.name}
              projectDescription={project.description || undefined}
              createdAt={project.created_at}
            />
          )}

          {activeTab === 'files' && (
            <div className="flex-1 flex min-h-0">
              <FileListPanel
                files={files}
                selectedFileId={selectedFileId}
                showUpload={showUpload}
                uploadFile={uploadFile}
                uploadIntent={uploadIntent}
                isUploading={isUploading}
                uploadError={uploadError}
                canSubmit={canSubmit}
                isDeletingFile={isDeletingFile}
                onSelectFile={onSelectFile}
                onToggleUpload={onToggleUpload}
                onUploadFileSelect={onUploadFileSelect}
                onUploadFileRemove={onUploadFileRemove}
                onUploadIntentChange={onUploadIntentChange}
                onUploadSubmit={onUploadSubmit}
                onDeleteFile={onDeleteFile}
              />

              <div className="w-px bg-border flex-shrink-0" />

              <FileAnalysisPanel
                selectedFile={selectedFile}
                analysisData={analysisData}
                isLoadingAnalysis={isLoadingAnalysis}
                analysisError={analysisError}
                showReanalyzeForm={showReanalyzeForm}
                reanalyzeIntent={reanalyzeIntent}
                isAnalyzing={isAnalyzing}
                hasAnalysis={hasAnalysis}
                canChat={canChat}
                filesExist={files.length > 0}
                onAnalyze={onAnalyze}
                onReanalyzeIntentChange={onReanalyzeIntentChange}
                onToggleReanalyzeForm={onToggleReanalyzeForm}
                onChatToggle={onChatToggle}
              />
            </div>
          )}

          {activeTab === 'dashboards' && (
            <DashboardsListView
              dashboards={dashboards}
              isLoading={isLoadingDashboards}
              onView={onViewDashboard}
              onDelete={onDeleteDashboard}
              isDeleting={isDeletingDashboard}
            />
          )}
        </AnimatedTabContent>
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
      <EditProjectDialog
        open={showEditProject}
        project={project}
        isUpdating={isUpdatingProject}
        onClose={onCloseEditProject}
        onUpdate={onUpdateProject}
      />
    </div>
  )
}
