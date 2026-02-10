import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Folder,
  FileSpreadsheet,
  FileText,
  ChevronRight,
  Loader2,
  Download,
  ArrowLeft,
} from 'lucide-react'
import { useIntegrationBrowse } from '@/services/api/queries/useIntegrationBrowse'
import { useImportFromProvider } from '@/services/api/mutations/useImportFromProvider'
import { useProjects } from '@/services/api/queries/useProjects'
import type { IntegrationResponse, ProviderFile } from '@/types/api'

interface FileBrowserDialogProps {
  integration: IntegrationResponse | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function FileIcon({ file }: { file: ProviderFile }) {
  if (file.is_folder) return <Folder className="h-4 w-4 text-blue-500" />
  if (file.mime_type?.includes('spreadsheet') || file.name.match(/\.(csv|xlsx?)$/i))
    return <FileSpreadsheet className="h-4 w-4 text-green-600" />
  return <FileText className="h-4 w-4 text-muted-foreground" />
}

function formatFileSize(bytes: number | null): string {
  if (bytes === null) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileBrowserDialog({ integration, open, onOpenChange }: FileBrowserDialogProps) {
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined)
  const [folderStack, setFolderStack] = useState<{ id: string; name: string }[]>([])

  const { data, isLoading, error } = useIntegrationBrowse(
    open && integration ? integration.id : null,
    currentFolderId
  )

  const importMutation = useImportFromProvider()
  const projectsQuery = useProjects()
  const firstProject = projectsQuery.data?.[0]

  const handleFolderClick = useCallback(
    (folder: ProviderFile) => {
      setFolderStack((prev) => [
        ...prev,
        { id: folder.id, name: folder.name },
      ])
      setCurrentFolderId(folder.id)
    },
    []
  )

  const handleBack = useCallback(() => {
    setFolderStack((prev) => {
      const next = prev.slice(0, -1)
      setCurrentFolderId(next.length > 0 ? next[next.length - 1]!.id : undefined)
      return next
    })
  }, [])

  const handleImport = useCallback(
    (file: ProviderFile) => {
      if (!integration || !firstProject) return
      importMutation.mutate({
        integration_id: integration.id,
        file_id: file.id,
        target_project_id: firstProject.id,
      })
    },
    [integration, firstProject, importMutation]
  )

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setCurrentFolderId(undefined)
        setFolderStack([])
      }
      onOpenChange(nextOpen)
    },
    [onOpenChange]
  )

  const allItems = [...(data?.folders ?? []), ...(data?.files ?? [])]

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Browse {integration?.provider ?? 'Provider'} Files
          </DialogTitle>
          <DialogDescription>
            Select a file to import into your project.
          </DialogDescription>
        </DialogHeader>

        {/* Breadcrumb / Back */}
        {folderStack.length > 0 && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={handleBack}>
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Back
            </Button>
            <ChevronRight className="h-3 w-3" />
            <span className="truncate font-medium text-foreground">
              {folderStack[folderStack.length - 1]?.name}
            </span>
          </div>
        )}

        {/* Content */}
        <ScrollArea className="h-[360px] rounded-md border">
          {isLoading ? (
            <div className="flex items-center justify-center h-full py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full py-20 text-sm text-destructive">
              Failed to load files. Please try again.
            </div>
          ) : allItems.length === 0 ? (
            <div className="flex items-center justify-center h-full py-20 text-sm text-muted-foreground">
              This folder is empty.
            </div>
          ) : (
            <div className="divide-y">
              {allItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors"
                >
                  <FileIcon file={item} />
                  {item.is_folder ? (
                    <button
                      className="flex-1 text-left text-sm font-medium hover:underline"
                      onClick={() => handleFolderClick(item)}
                    >
                      {item.name}
                    </button>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      {item.size !== null && (
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(item.size)}
                        </p>
                      )}
                    </div>
                  )}
                  {item.is_folder ? (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  ) : item.can_import ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => handleImport(item)}
                      disabled={importMutation.isPending || !firstProject}
                    >
                      {importMutation.isPending &&
                      importMutation.variables?.file_id === item.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
