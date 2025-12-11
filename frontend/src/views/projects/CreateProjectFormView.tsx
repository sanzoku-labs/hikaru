import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface CreateProjectFormViewProps {
  isOpen: boolean
  name: string
  description: string
  errors: { name?: string; description?: string }
  onNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onSubmit: () => void
  onClose: () => void
  isSubmitting: boolean
}

export function CreateProjectFormView({
  isOpen,
  name,
  description,
  errors,
  onNameChange,
  onDescriptionChange,
  onSubmit,
  onClose,
  isSubmitting,
}: CreateProjectFormViewProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Name field */}
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              type="text"
              placeholder="My Data Project"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className={cn(
                errors.name && 'border-destructive focus-visible:ring-destructive'
              )}
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Description field */}
          <div className="space-y-2">
            <Label htmlFor="project-description">
              Description <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <textarea
              id="project-description"
              placeholder="Brief description of your project..."
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={3}
              className={cn(
                'flex w-full rounded-md border border-input bg-background px-3 py-2',
                'text-sm ring-offset-background',
                'placeholder:text-muted-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'resize-none'
              )}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium',
                'bg-secondary text-secondary-foreground',
                'hover:bg-secondary/80 transition-colors'
              )}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium',
                'bg-primary text-primary-foreground',
                'hover:bg-primary/90 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
