import { useState } from 'react'
import { cn, formatDate } from '@/lib/utils'
import {
  FolderOpen,
  FileSpreadsheet,
  ChevronDown,
  ChevronRight,
  Plus,
  Clock,
  MessageSquare,
  Trash2,
  PlusCircle,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useProjectDetail } from '@/services/api/queries/useProjectDetail'
import type { FileContext, ProjectResponse, ConversationSummary, ProjectFileResponse } from '@/types/api'

// Component for displaying files within a project (fetches its own data)
function ProjectFiles({
  project,
  selectedFiles,
  canAddMore,
  onFileClick,
}: {
  project: ProjectResponse
  selectedFiles: FileContext[]
  canAddMore: boolean
  onFileClick: (file: FileContext) => void
}) {
  const { data: projectDetail, isLoading } = useProjectDetail(project.id)

  const isFileSelected = (fileId: number) =>
    selectedFiles.some((f) => f.file_id === fileId)

  if (isLoading) {
    return (
      <div className="ml-6 py-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading files...
      </div>
    )
  }

  const files = projectDetail?.files || []

  if (files.length === 0) {
    return (
      <div className="ml-6 text-xs text-muted-foreground py-1 px-2">
        No files
      </div>
    )
  }

  return (
    <div className="ml-6 mt-1 space-y-0.5">
      {files.map((file: ProjectFileResponse) => {
        const isSelected = isFileSelected(file.id)
        const canSelect = canAddMore || isSelected

        return (
          <button
            key={file.id}
            onClick={() =>
              onFileClick({
                file_id: file.id,
                filename: file.filename,
                project_id: project.id,
                project_name: project.name,
              })
            }
            disabled={!canSelect}
            className={cn(
              'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm',
              'transition-colors text-left',
              isSelected
                ? 'bg-primary/10 text-primary'
                : canSelect
                ? 'hover:bg-muted text-foreground'
                : 'text-muted-foreground cursor-not-allowed'
            )}
          >
            <FileSpreadsheet className="h-4 w-4 flex-shrink-0" />
            <span className="truncate flex-1">{file.filename}</span>
            {isSelected && <Plus className="h-3 w-3 rotate-45" />}
          </button>
        )
      })}
    </div>
  )
}

interface FileSelectionPanelProps {
  projects: ProjectResponse[]
  isLoading: boolean
  selectedFiles: FileContext[]
  canAddMore: boolean
  onAddFile: (file: FileContext) => void
  onRemoveFile: (fileId: number) => void
  conversations: ConversationSummary[]
  isLoadingConversations: boolean
  currentConversationId: string | null
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
  onDeleteConversation: (id: string) => void
}

export function FileSelectionPanel({
  projects,
  isLoading,
  selectedFiles,
  canAddMore,
  onAddFile,
  onRemoveFile,
  conversations,
  isLoadingConversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: FileSelectionPanelProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(new Set())
  const [showFiles, setShowFiles] = useState(true)
  const [showHistory, setShowHistory] = useState(false)

  const toggleProject = (projectId: number) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev)
      if (next.has(projectId)) {
        next.delete(projectId)
      } else {
        next.add(projectId)
      }
      return next
    })
  }

  const handleFileClick = (file: FileContext) => {
    const isSelected = selectedFiles.some((f) => f.file_id === file.file_id)
    if (isSelected) {
      onRemoveFile(file.file_id)
    } else if (canAddMore) {
      onAddFile(file)
    }
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex-shrink-0 p-4 pb-2">
        <CardTitle className="text-sm font-medium">
          Context Selection
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 p-0 flex flex-col min-h-0">
        {/* Tab buttons */}
        <div className="flex gap-1 px-4 mb-2">
          <Button
            variant={showFiles ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => {
              setShowFiles(true)
              setShowHistory(false)
            }}
            className="flex-1"
          >
            <FileSpreadsheet className="h-4 w-4 mr-1" />
            Files
          </Button>
          <Button
            variant={showHistory ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => {
              setShowFiles(false)
              setShowHistory(true)
            }}
            className="flex-1"
          >
            <Clock className="h-4 w-4 mr-1" />
            History
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="px-4 pb-4">
            {showFiles && (
              <>
                {/* Selection limit indicator */}
                <div className="text-xs text-muted-foreground mb-3">
                  {selectedFiles.length}/5 files selected
                </div>

                {/* Project list */}
                {isLoading ? (
                  <div className="text-sm text-muted-foreground py-4 text-center">
                    Loading projects...
                  </div>
                ) : projects.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4 text-center">
                    No projects yet
                  </div>
                ) : (
                  <div className="space-y-1">
                    {projects.map((project) => (
                      <Collapsible
                        key={project.id}
                        open={expandedProjects.has(project.id)}
                        onOpenChange={() => toggleProject(project.id)}
                      >
                        <CollapsibleTrigger asChild>
                          <button
                            className={cn(
                              'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm',
                              'hover:bg-muted transition-colors',
                              'text-left'
                            )}
                          >
                            {expandedProjects.has(project.id) ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <FolderOpen className="h-4 w-4 text-primary" />
                            <span className="truncate flex-1">{project.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {project.file_count || 0}
                            </span>
                          </button>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <ProjectFiles
                            project={project}
                            selectedFiles={selectedFiles}
                            canAddMore={canAddMore}
                            onFileClick={handleFileClick}
                          />
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                )}
              </>
            )}

            {showHistory && (
              <>
                {/* New conversation button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNewConversation}
                  className="w-full mb-3"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Conversation
                </Button>

                {/* Conversation list */}
                {isLoadingConversations ? (
                  <div className="text-sm text-muted-foreground py-4 text-center">
                    Loading...
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4 text-center">
                    No conversations yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {conversations.map((conv) => (
                      <div
                        key={conv.conversation_id}
                        className={cn(
                          'group p-2 rounded-md cursor-pointer',
                          'border border-transparent',
                          currentConversationId === conv.conversation_id
                            ? 'bg-primary/10 border-primary/30'
                            : 'hover:bg-muted'
                        )}
                        onClick={() => onSelectConversation(conv.conversation_id)}
                      >
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {conv.title || 'Untitled conversation'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {conv.message_count} messages · {formatDate(conv.updated_at)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation()
                              onDeleteConversation(conv.conversation_id)
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
