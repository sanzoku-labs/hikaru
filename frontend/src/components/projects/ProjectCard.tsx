/**
 * ProjectCard - Enhanced project card matching Mockup 1
 *
 * Features:
 * - Project thumbnail/icon
 * - Project name and description
 * - File count, analysis count, last updated
 * - Status badges (active, archived)
 * - Action buttons (Open, Settings, Delete)
 * - Hover effects with shadow
 */

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FolderOpen, FileText, BarChart3, Calendar, MoreVertical, Settings, Trash2, Archive } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ProjectCardProps {
  project: {
    id: number
    name: string
    description?: string
    file_count?: number
    analysis_count?: number
    updated_at: string
    status?: 'active' | 'archived'
  }
  onOpen: () => void
  onSettings?: () => void
  onArchive?: () => void
  onDelete?: () => void
  className?: string
  variant?: 'default' | 'compact' | 'recent'
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function ProjectCard({
  project,
  onOpen,
  onSettings,
  onArchive,
  onDelete,
  className,
  variant = 'default'
}: ProjectCardProps) {
  const isArchived = project.status === 'archived'

  // Compact variant for "Recently Opened" section
  if (variant === 'compact' || variant === 'recent') {
    return (
      <Card
        className={cn(
          'hover:shadow-card-hover transition-all cursor-pointer',
          variant === 'recent' && 'border-primary/30 bg-accent/30',
          isArchived && 'opacity-60',
          className
        )}
        onClick={onOpen}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-2.5 rounded-lg bg-primary/10">
              <FolderOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate flex items-center gap-2">
                {project.name}
                {variant === 'recent' && (
                  <Badge variant="secondary" className="text-xs ml-auto">Recent</Badge>
                )}
              </CardTitle>
              {project.description && (
                <CardDescription className="line-clamp-1 text-xs mt-1">
                  {project.description}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              <span>{project.file_count || 0} files</span>
            </div>
            {(project.analysis_count ?? 0) > 0 && (
              <div className="flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" />
                <span>{project.analysis_count} analyses</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Default variant for main grid
  return (
    <Card
      className={cn(
        'hover:shadow-card-hover transition-all group',
        isArchived && 'opacity-60',
        className
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 p-3 rounded-lg bg-primary/10">
              <FolderOpen className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-lg truncate">{project.name}</CardTitle>
                {isArchived && (
                  <Badge variant="secondary" className="text-xs">
                    <Archive className="h-3 w-3 mr-1" />
                    Archived
                  </Badge>
                )}
              </div>
              {project.description && (
                <CardDescription className="line-clamp-2">
                  {project.description}
                </CardDescription>
              )}
            </div>
          </div>

          {/* Actions Dropdown */}
          {(onSettings || onArchive || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onSettings && (
                  <DropdownMenuItem onClick={onSettings}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                )}
                {onArchive && (
                  <DropdownMenuItem onClick={onArchive}>
                    <Archive className="h-4 w-4 mr-2" />
                    {isArchived ? 'Unarchive' : 'Archive'}
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onDelete} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">{project.file_count || 0}</p>
              <p className="text-xs text-muted-foreground">Files</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">{project.analysis_count || 0}</p>
              <p className="text-xs text-muted-foreground">Analyses</p>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
          <Calendar className="h-3.5 w-3.5" />
          <span>Updated {formatDate(project.updated_at)}</span>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          variant="default"
          size="sm"
          className="w-full"
          onClick={onOpen}
        >
          Open Project
        </Button>
      </CardFooter>
    </Card>
  )
}
