/**
 * FileExplorer - Left sidebar file list for Project Detail
 * Matches Mockup 7 (Project Detail) file explorer sidebar
 */
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Search,
  Plus,
  FolderPlus,
  FileText,
  FileSpreadsheet,
  File,
  CheckCircle2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileItem {
  id: number
  filename: string
  fileSize: string
  fileType: 'csv' | 'xlsx' | 'json' | 'pdf' | 'other'
  hasAnalysis: boolean
  uploadedAt: string
}

interface FileExplorerProps {
  files: FileItem[]
  selectedFileId?: number
  onFileSelect: (fileId: number) => void
  onUploadFile: () => void
  className?: string
}

const getFileIcon = (fileType: string) => {
  switch (fileType) {
    case 'csv':
    case 'xlsx':
      return FileSpreadsheet
    case 'json':
    case 'pdf':
      return FileText
    default:
      return File
  }
}

const getFileTypeColor = (fileType: string) => {
  switch (fileType) {
    case 'csv':
      return 'bg-emerald-100 text-emerald-700'
    case 'xlsx':
      return 'bg-blue-100 text-blue-700'
    case 'json':
      return 'bg-purple-100 text-purple-700'
    case 'pdf':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

export function FileExplorer({
  files,
  selectedFileId,
  onFileSelect,
  onUploadFile,
  className
}: FileExplorerProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredFiles = files.filter(file =>
    file.filename.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className={cn('flex flex-col h-full bg-card border-r', className)}>
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Files</h3>
          <Badge variant="secondary">{files.length}</Badge>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* File List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredFiles.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {searchTerm ? 'No files found' : 'No files uploaded'}
            </div>
          ) : (
            filteredFiles.map((file) => {
              const Icon = getFileIcon(file.fileType)
              const isSelected = file.id === selectedFileId

              return (
                <button
                  key={file.id}
                  onClick={() => onFileSelect(file.id)}
                  className={cn(
                    'w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors',
                    isSelected
                      ? 'bg-primary/10 border border-primary/20'
                      : 'hover:bg-accent'
                  )}
                >
                  <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', isSelected && 'text-primary')} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={cn('text-sm font-medium truncate', isSelected && 'text-primary')}>
                        {file.filename}
                      </p>
                      {file.hasAnalysis && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={cn('text-xs', getFileTypeColor(file.fileType))}
                      >
                        {file.fileType.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{file.fileSize}</span>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </ScrollArea>

      {/* Actions */}
      <div className="p-4 border-t space-y-2">
        <Button onClick={onUploadFile} className="w-full" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Upload File
        </Button>
        <Button variant="outline" className="w-full" size="sm" disabled>
          <FolderPlus className="h-4 w-4 mr-2" />
          New Folder
        </Button>
      </div>
    </div>
  )
}
