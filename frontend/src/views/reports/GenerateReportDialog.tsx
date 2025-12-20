import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { FileText, Loader2 } from 'lucide-react'
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProjects } from '@/services/api/queries/useProjects'
import type { ReportTemplate, ProjectResponse } from '@/types/api'

interface GenerateReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: ReportTemplate | null
  onGenerate: (config: {
    template_id: string
    project_id?: number
    title?: string
    include_raw_data: boolean
  }) => void
  isGenerating: boolean
}

export function GenerateReportDialog({
  open,
  onOpenChange,
  template,
  onGenerate,
  isGenerating,
}: GenerateReportDialogProps) {
  const [title, setTitle] = useState('')
  const [projectId, setProjectId] = useState<string>('')
  const [includeRawData, setIncludeRawData] = useState(false)

  // Fetch projects for selection
  const { data: projects = [] } = useProjects()

  // Reset form when template changes
  useEffect(() => {
    if (template) {
      setTitle(`${template.name} - ${new Date().toLocaleDateString()}`)
      setProjectId('')
      setIncludeRawData(false)
    }
  }, [template])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!template) return

    onGenerate({
      template_id: template.id,
      project_id: projectId ? parseInt(projectId, 10) : undefined,
      title: title.trim() || undefined,
      include_raw_data: includeRawData,
    })
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isGenerating) {
      setTitle('')
      setProjectId('')
      setIncludeRawData(false)
    }
    onOpenChange(newOpen)
  }

  if (!template) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Generate Report</DialogTitle>
            <DialogDescription>
              Create a {template.name} report. Estimated {template.estimated_pages} pages.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-4">
            {/* Report Title */}
            <div className="space-y-2">
              <Label htmlFor="report-title">Report Title</Label>
              <Input
                id="report-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Q4 2025 Analysis Report"
                disabled={isGenerating}
              />
            </div>

            {/* Project Selection */}
            <div className="space-y-2">
              <Label htmlFor="project-select">Data Source (Project)</Label>
              <Select
                value={projectId}
                onValueChange={setProjectId}
                disabled={isGenerating}
              >
                <SelectTrigger id="project-select">
                  <SelectValue placeholder="Select a project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project: ProjectResponse) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                      {project.file_count !== undefined && (
                        <span className="text-muted-foreground ml-2">
                          ({project.file_count} files)
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                All files in the selected project will be included in the report.
              </p>
            </div>

            {/* Include Raw Data Option */}
            {template.sections.includes('raw_data') && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-raw-data"
                  checked={includeRawData}
                  onCheckedChange={(checked) => setIncludeRawData(checked === true)}
                  disabled={isGenerating}
                />
                <Label
                  htmlFor="include-raw-data"
                  className="text-sm font-normal cursor-pointer"
                >
                  Include raw data tables (larger file size)
                </Label>
              </div>
            )}

            {/* Template Info */}
            <div className="p-3 bg-muted/50 rounded-lg space-y-1">
              <p className="text-sm font-medium">{template.name}</p>
              <p className="text-xs text-muted-foreground">
                Sections: {template.sections.join(', ')}
              </p>
            </div>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              disabled={isGenerating}
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
              disabled={!projectId || isGenerating}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
                'bg-primary text-primary-foreground',
                'hover:bg-primary/90 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Generate Report
                </>
              )}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
