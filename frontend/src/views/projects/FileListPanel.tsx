import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { formatFileSize } from '@/lib/utils'
import {
  Plus,
  FileSpreadsheet,
  X,
  CheckCircle2,
  Trash2,
} from 'lucide-react'
import { EmptyStateView } from '@/views/shared'
import { ConfirmDialog } from '@/views/shared/ConfirmDialog'
import { AnalysisFormView } from '@/views/analysis'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { ProjectFileResponse } from '@/types/api'

interface FileListPanelProps {
  files: ProjectFileResponse[]
  selectedFileId: number | null
  showUpload: boolean
  uploadFile: File | null
  uploadIntent: string
  isUploading: boolean
  uploadError: string | null
  canSubmit: boolean
  isDeletingFile: number | null | undefined
  onSelectFile: (fileId: number) => void
  onToggleUpload: (open?: boolean) => void
  onUploadFileSelect: (file: File) => void
  onUploadFileRemove: () => void
  onUploadIntentChange: (intent: string) => void
  onUploadSubmit: () => void
  onDeleteFile: (fileId: number) => void
}

export const FileListPanel = React.memo(function FileListPanel({
  files,
  selectedFileId,
  showUpload,
  uploadFile,
  uploadIntent,
  isUploading,
  uploadError,
  canSubmit,
  isDeletingFile,
  onSelectFile,
  onToggleUpload,
  onUploadFileSelect,
  onUploadFileRemove,
  onUploadIntentChange,
  onUploadSubmit,
  onDeleteFile,
}: FileListPanelProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<ProjectFileResponse | null>(null)

  return (
    <>
      <div className="w-56 md:w-72 lg:w-80 flex-shrink-0 flex flex-col pr-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Files ({files.length})
          </h3>
          <Popover open={showUpload} onOpenChange={onToggleUpload}>
            <PopoverTrigger asChild>
              <Button
                variant={showUpload ? 'ghost' : 'default'}
                size="sm"
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
              </Button>
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    setFileToDelete(file)
                    setDeleteConfirmOpen(true)
                  }}
                  disabled={isDeletingFile === file.id}
                  className={cn(
                    'h-8 w-8 opacity-0 group-hover:opacity-100',
                    'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
                    isDeletingFile === file.id && 'opacity-100'
                  )}
                  title="Delete file"
                >
                  {isDeletingFile === file.id ? (
                    <span className="h-4 w-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin block" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete File Confirmation */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete file"
        description={`Are you sure you want to delete "${fileToDelete?.filename}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (fileToDelete) {
            onDeleteFile(fileToDelete.id)
            setDeleteConfirmOpen(false)
            setFileToDelete(null)
          }
        }}
        isLoading={isDeletingFile === fileToDelete?.id}
      />
    </>
  )
})
