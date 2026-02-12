import { useState } from 'react'
import { cn, formatFileSize, formatDateTime } from '@/lib/utils'
import {
  FileText,
  Calendar,
  Briefcase,
  FileSpreadsheet,
  GitCompare,
  Download,
  Trash2,
  Clock,
  FileStack,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AnimatedTabContent } from '@/components/animation'
import { PageHeaderView, LoadingSpinnerView, ErrorAlertView, EmptyStateView } from '@/views/shared'
import { GenerateReportDialog } from './GenerateReportDialog'
import { AnimatedList, AnimatedListItem } from '@/components/animation'
import type { ReportTemplate, GeneratedReport } from '@/types/api'

interface ReportsViewProps {
  // Templates
  templates: ReportTemplate[]
  templatesLoading: boolean
  templatesError: string | null

  // Generated reports
  reports: GeneratedReport[]
  reportsLoading: boolean
  reportsError: string | null

  // Generation
  onGenerate: (config: {
    template_id: string
    project_id?: number
    title?: string
    include_raw_data: boolean
  }) => void
  isGenerating: boolean

  // Actions
  onDownload: (report: GeneratedReport) => void
  onDelete: (reportId: string) => void
  isDeleting: string | null
}

// Icon mapping for templates
const templateIcons: Record<string, React.ReactNode> = {
  calendar: <Calendar className="h-6 w-6" />,
  briefcase: <Briefcase className="h-6 w-6" />,
  'file-text': <FileSpreadsheet className="h-6 w-6" />,
  'git-compare': <GitCompare className="h-6 w-6" />,
}

// Category color mapping
const categoryColors: Record<string, string> = {
  summary: 'bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400',
  detailed: 'bg-purple-500/10 text-purple-700 border-purple-200 dark:text-purple-400',
  comparison: 'bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-400',
  custom: 'bg-gray-500/10 text-gray-700 border-gray-200 dark:text-gray-400',
}

// Template card component
function TemplateCard({
  template,
  onSelect,
}: {
  template: ReportTemplate
  onSelect: () => void
}) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200',
        'hover:border-primary/30 hover:shadow-[0_8px_30px_-8px_hsl(var(--primary)/0.12)]',
        'group'
      )}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
            {templateIcons[template.icon] || <FileText className="h-6 w-6" />}
          </div>
          <Badge variant="outline" className={cn('text-xs', categoryColors[template.category])}>
            {template.category}
          </Badge>
        </div>
        <CardTitle className="text-base mt-3 flex items-center gap-2 group-hover:text-primary transition-colors">
          {template.name}
          <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {template.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <FileStack className="h-4 w-4" />
            ~{template.estimated_pages} pages
          </span>
          <span className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" />
            {template.sections.length} sections
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

// Generated report card component
function ReportCard({
  report,
  onDownload,
  onDelete,
  isDeleting,
}: {
  report: GeneratedReport
  onDownload: () => void
  onDelete: () => void
  isDeleting: boolean
}) {
  // Calculate expiry time
  const expiresAt = new Date(report.expires_at)
  const now = new Date()
  const hoursRemaining = Math.max(0, Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)))

  return (
    <Card className="transition-all duration-200 hover:border-primary/30 hover:shadow-[0_8px_30px_-8px_hsl(var(--primary)/0.12)]">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary flex-shrink-0">
            <FileText className="h-5 w-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">
              {report.title}
            </h3>

            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                {report.template_name}
              </Badge>
              <span className="text-muted-foreground/50">·</span>
              <span>{report.file_count} files</span>
              <span className="text-muted-foreground/50">·</span>
              <span>{report.page_count} pages</span>
              <span className="text-muted-foreground/50">·</span>
              <span>{formatFileSize(report.file_size)}</span>
            </div>

            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Created {formatDateTime(report.created_at)}</span>
              {hoursRemaining > 0 && (
                <>
                  <span className="text-muted-foreground/50">·</span>
                  <span className={hoursRemaining <= 2 ? 'text-amber-500' : ''}>
                    Expires in {hoursRemaining}h
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onDownload()
              }}
            >
              <Download className="h-4 w-4 mr-1.5" />
              Download
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ReportsView({
  templates,
  templatesLoading,
  templatesError,
  reports,
  reportsLoading,
  reportsError,
  onGenerate,
  isGenerating,
  onDownload,
  onDelete,
  isDeleting,
}: ReportsViewProps) {
  const [activeTab, setActiveTab] = useState('templates')
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleTemplateSelect = (template: ReportTemplate) => {
    setSelectedTemplate(template)
    setDialogOpen(true)
  }

  const handleGenerate = (config: {
    template_id: string
    project_id?: number
    title?: string
    include_raw_data: boolean
  }) => {
    onGenerate(config)
    // Dialog will close on success via the mutation callback
  }

  // Handle successful generation - close dialog
  const handleDialogClose = (open: boolean) => {
    if (!isGenerating) {
      setDialogOpen(open)
      if (!open) {
        setSelectedTemplate(null)
      }
    }
  }

  return (
    <div className="space-y-6">
      <PageHeaderView
        title="Reports"
        description="Generate professional PDF reports from your data analyses"
        compact
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="border-b border-border">
          <TabsList className="h-10 bg-transparent p-0 gap-4">
            <TabsTrigger
              value="templates"
              className="relative h-10 rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              <FileText className="h-4 w-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger
              value="generated"
              className="relative h-10 rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              <FileStack className="h-4 w-4 mr-2" />
              My Reports
              {reports.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-muted">
                  {reports.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <AnimatedTabContent activeTab={activeTab} className="mt-6">
          {activeTab === 'templates' && (
            <div className="space-y-6">
              {templatesError ? (
                <ErrorAlertView
                  title="Failed to load templates"
                  message={templatesError}
                />
              ) : templatesLoading ? (
                <div className="py-20">
                  <LoadingSpinnerView size="lg" label="Loading templates..." />
                </div>
              ) : templates.length === 0 ? (
                <EmptyStateView
                  icon={<FileText className="h-12 w-12" />}
                  title="No templates available"
                  description="Report templates are not configured."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onSelect={() => handleTemplateSelect(template)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'generated' && (
            <div className="space-y-4">
              {reportsError ? (
                <ErrorAlertView
                  title="Failed to load reports"
                  message={reportsError}
                />
              ) : reportsLoading ? (
                <div className="py-20">
                  <LoadingSpinnerView size="lg" label="Loading reports..." />
                </div>
              ) : reports.length === 0 ? (
                <EmptyStateView
                  icon={<FileStack className="h-12 w-12" />}
                  title="No reports generated"
                  description="Select a template to generate your first report."
                  action={{
                    label: 'Browse Templates',
                    onClick: () => setActiveTab('templates'),
                  }}
                />
              ) : (
                <AnimatedList className="space-y-3">
                  {reports.map((report, index) => (
                    <AnimatedListItem
                      key={report.report_id}
                      layoutId={`report-${report.report_id}`}
                      index={index}
                    >
                      <ReportCard
                        report={report}
                        onDownload={() => onDownload(report)}
                        onDelete={() => onDelete(report.report_id)}
                        isDeleting={isDeleting === report.report_id}
                      />
                    </AnimatedListItem>
                  ))}
                </AnimatedList>
              )}
            </div>
          )}
        </AnimatedTabContent>
      </Tabs>

      {/* Generate Dialog */}
      <GenerateReportDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        template={selectedTemplate}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
      />
    </div>
  )
}
