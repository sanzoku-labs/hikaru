import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Save } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SaveDashboardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (name: string) => void
  isSaving: boolean
  defaultName?: string
  dashboardType: 'single_file' | 'comparison' | 'merged'
}

const typeLabels = {
  single_file: 'Single File Analysis',
  comparison: 'File Comparison',
  merged: 'Merged Analysis',
}

export function SaveDashboardDialog({
  open,
  onOpenChange,
  onSave,
  isSaving,
  defaultName = '',
  dashboardType,
}: SaveDashboardDialogProps) {
  const [name, setName] = useState(defaultName)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onSave(name.trim())
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset name when closing
      setName(defaultName)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Save as Dashboard</DialogTitle>
            <DialogDescription>
              Save this {typeLabels[dashboardType].toLowerCase()} as a dashboard to view it later.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="dashboard-name">Dashboard name</Label>
              <Input
                id="dashboard-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Q4 Sales Analysis"
                autoFocus
                disabled={isSaving}
              />
            </div>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              disabled={isSaving}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium',
                'bg-secondary text-secondary-foreground',
                'hover:bg-secondary/80 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSaving}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
                'bg-primary text-primary-foreground',
                'hover:bg-primary/90 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isSaving ? (
                <>
                  <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Dashboard
                </>
              )}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
