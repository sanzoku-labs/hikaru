import { cn } from '@/lib/utils'
import { formatFileSize, formatDate } from '@/lib/utils'
import {
  Plus,
  FileSpreadsheet,
  GitCompare,
  Merge,
  ChevronRight,
  X,
} from 'lucide-react'
import { PageHeaderView, EmptyStateView, LoadingSpinnerView, ErrorAlertView } from '@/views/shared'
import { AnalysisFormView } from '@/views/analysis'
import type { ProjectDetailResponse } from '@/types/api'

interface ProjectDetailViewProps {
  // Data
  project: ProjectDetailResponse | null
  isLoading: boolean
  fetchError: string | null

  // Upload form state
  showUpload: boolean
  selectedFile: File | null
  userIntent: string
  isUploading: boolean
  uploadError: string | null
  canSubmit: boolean

  // Handlers
  onToggleUpload: () => void
  onFileSelect: (file: File) => void
  onFileRemove: () => void
  onUserIntentChange: (intent: string) => void
  onUploadSubmit: () => void
  onFileClick: (fileId: number) => void
  onCompareClick: () => void
  onMergeClick: () => void
  onBackClick: () => void
}

export function ProjectDetailView({
  project,
  isLoading,
  fetchError,
  showUpload,
  selectedFile,
  userIntent,
  isUploading,
  uploadError,
  canSubmit,
  onToggleUpload,
  onFileSelect,
  onFileRemove,
  onUserIntentChange,
  onUploadSubmit,
  onFileClick,
  onCompareClick,
  onMergeClick,
  onBackClick,
}: ProjectDetailViewProps) {
  const files = project?.files || []
  const hasMultipleFiles = files.length >= 2

  if (isLoading) {
    return (
      <div className="py-20">
        <LoadingSpinnerView size="lg" label="Loading project..." />
      </div>
    )
  }

  if (fetchError || !project) {
    return (
      <div className="max-w-6xl mx-auto">
        <ErrorAlertView
          title="Failed to load project"
          message={fetchError || 'Project not found'}
          onRetry={onBackClick}
        />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <PageHeaderView
        title={project.name}
        description={project.description || 'No description'}
        backButton={{ label: 'Back to Projects', onClick: onBackClick }}
        actions={
          <div className="flex items-center gap-2">
            {hasMultipleFiles && (
              <>
                <button
                  onClick={onCompareClick}
                  className={cn(
                    'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
                    'bg-secondary text-secondary-foreground font-medium text-sm',
                    'transition-colors hover:bg-secondary/80'
                  )}
                >
                  <GitCompare className="h-4 w-4" />
                  Compare
                </button>
                <button
                  onClick={onMergeClick}
                  className={cn(
                    'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
                    'bg-secondary text-secondary-foreground font-medium text-sm',
                    'transition-colors hover:bg-secondary/80'
                  )}
                >
                  <Merge className="h-4 w-4" />
                  Merge
                </button>
              </>
            )}
            <button
              onClick={onToggleUpload}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
                'bg-primary text-primary-foreground font-medium text-sm',
                'transition-all duration-200',
                'hover:bg-primary/90 hover:glow-primary-sm'
              )}
            >
              {showUpload ? (
                <>
                  <X className="h-4 w-4" />
                  Cancel
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add File
                </>
              )}
            </button>
          </div>
        }
      />

      {/* Upload form */}
      {showUpload && (
        <div className="mb-8 animate-in-up">
          <AnalysisFormView
            selectedFile={selectedFile}
            userIntent={userIntent}
            error={uploadError}
            canSubmit={canSubmit && !isUploading}
            onFileSelect={onFileSelect}
            onFileRemove={onFileRemove}
            onUserIntentChange={onUserIntentChange}
            onSubmit={onUploadSubmit}
            submitLabel={isUploading ? 'Uploading...' : 'Upload & Analyze'}
          />
        </div>
      )}

      {/* Empty state */}
      {files.length === 0 && !showUpload && (
        <EmptyStateView
          icon={<FileSpreadsheet className="h-12 w-12" />}
          title="No files yet"
          description="Upload CSV or Excel files to start analyzing your data"
          action={{ label: 'Add File', onClick: onToggleUpload }}
        />
      )}

      {/* Files list */}
      {files.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Files ({files.length})
          </h3>
          <div className="space-y-2 stagger-children">
            {files.map((file) => (
              <div
                key={file.id}
                className={cn(
                  'group flex items-center gap-4 p-4 rounded-xl',
                  'bg-card border border-border',
                  'transition-all duration-200',
                  'hover:border-primary/30 hover:shadow-sm',
                  'cursor-pointer'
                )}
                onClick={() => onFileClick(file.id)}
              >
                {/* File icon */}
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground truncate">
                    {file.filename}
                  </h4>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                    <span>{formatFileSize(file.file_size)}</span>
                    <span>•</span>
                    <span>{file.data_schema?.row_count?.toLocaleString() || '?'} rows</span>
                    <span>•</span>
                    <span>{formatDate(file.uploaded_at)}</span>
                  </div>
                </div>

                {/* Chevron */}
                <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
