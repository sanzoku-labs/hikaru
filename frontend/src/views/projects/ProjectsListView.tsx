import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import {
  Plus,
  FolderKanban,
  FileSpreadsheet,
  Trash2,
  ChevronRight,
} from 'lucide-react'
import { PageHeaderView, EmptyStateView, LoadingSpinnerView, ErrorAlertView } from '@/views/shared'
import { CreateProjectFormView } from './CreateProjectFormView'
import type { ProjectResponse } from '@/types/api'

interface ProjectsListViewProps {
  // Data
  projects: ProjectResponse[]
  isLoading: boolean
  fetchError: string | null

  // Create form
  createFormOpen: boolean
  createFormData: { name: string; description: string }
  createFormErrors: { name?: string; description?: string }

  // Handlers
  onOpenCreateForm: () => void
  onCloseCreateForm: () => void
  onCreateFieldChange: (field: 'name' | 'description', value: string) => void
  onCreate: () => void
  onDelete: (projectId: number) => void
  onProjectClick: (projectId: number) => void

  // Status
  isCreating: boolean
  isDeleting: boolean
  deletingId: number | null
}

export function ProjectsListView({
  projects,
  isLoading,
  fetchError,
  createFormOpen,
  createFormData,
  createFormErrors,
  onOpenCreateForm,
  onCloseCreateForm,
  onCreateFieldChange,
  onCreate,
  onDelete,
  onProjectClick,
  isCreating,
  isDeleting,
  deletingId,
}: ProjectsListViewProps) {
  return (
    <div>
      {/* Header */}
      <PageHeaderView
        title="Projects"
        description="Organize your data files into projects for multi-file analysis"
        actions={
          <button
            onClick={onOpenCreateForm}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
              'bg-primary text-primary-foreground font-medium text-sm',
              'transition-all duration-200',
              'hover:bg-primary/90 hover:glow-primary-sm'
            )}
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        }
      />

      {/* Loading state */}
      {isLoading && (
        <div className="py-20">
          <LoadingSpinnerView size="lg" label="Loading projects..." />
        </div>
      )}

      {/* Error state */}
      {fetchError && !isLoading && (
        <ErrorAlertView
          title="Failed to load projects"
          message={fetchError}
          className="mb-6"
        />
      )}

      {/* Empty state */}
      {!isLoading && !fetchError && projects.length === 0 && (
        <EmptyStateView
          icon={<FolderKanban className="h-12 w-12" />}
          title="No projects yet"
          description="Create your first project to start organizing your data files"
          action={{ label: 'Create Project', onClick: onOpenCreateForm }}
        />
      )}

      {/* Projects grid */}
      {!isLoading && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {projects.map((project) => (
            <div
              key={project.id}
              className={cn(
                'group relative p-5 rounded-xl',
                'bg-card border border-border',
                'transition-all duration-200',
                'hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
                'cursor-pointer'
              )}
              onClick={() => onProjectClick(project.id)}
            >
              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(project.id)
                }}
                disabled={isDeleting && deletingId === project.id}
                className={cn(
                  'absolute top-3 right-3 p-2 rounded-lg',
                  'text-muted-foreground',
                  'opacity-0 group-hover:opacity-100',
                  'transition-all duration-200',
                  'hover:bg-destructive/10 hover:text-destructive',
                  'disabled:opacity-50'
                )}
                aria-label="Delete project"
              >
                {isDeleting && deletingId === project.id ? (
                  <span className="h-4 w-4 border-2 border-current/30 border-t-current rounded-full animate-spin block" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>

              {/* Project icon */}
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary w-fit mb-4">
                <FolderKanban className="h-5 w-5" />
              </div>

              {/* Project name */}
              <h3 className="font-semibold text-foreground mb-1 pr-8 truncate">
                {project.name}
              </h3>

              {/* Description */}
              {project.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {project.description}
                </p>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>{project.file_count || 0} files</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <span>{formatDate(project.created_at)}</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create project modal */}
      <CreateProjectFormView
        isOpen={createFormOpen}
        name={createFormData.name}
        description={createFormData.description}
        errors={createFormErrors}
        onNameChange={(value) => onCreateFieldChange('name', value)}
        onDescriptionChange={(value) => onCreateFieldChange('description', value)}
        onSubmit={onCreate}
        onClose={onCloseCreateForm}
        isSubmitting={isCreating}
      />
    </div>
  )
}
