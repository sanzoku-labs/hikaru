import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { ProjectDetailResponse } from '@/types/api'

interface EditProjectDialogProps {
  open: boolean
  project: ProjectDetailResponse | null
  isUpdating: boolean
  onClose: () => void
  onUpdate: (name: string, description: string) => void
}

export const EditProjectDialog = React.memo(function EditProjectDialog({
  open,
  project,
  isUpdating,
  onClose,
  onUpdate,
}: EditProjectDialogProps) {
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')

  // Sync form when dialog opens
  useEffect(() => {
    if (open && project) {
      setEditName(project.name)
      setEditDescription(project.description || '')
    }
  }, [open, project])

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
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
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={() => onUpdate(editName, editDescription)}
            disabled={isUpdating || !editName.trim()}
          >
            {isUpdating ? (
              <>
                <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})
