/**
 * FileInfoCard - File statistics and action buttons
 * Matches Mockup 7 (Project Detail) file info section
 */
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Download, BarChart3, FileText, Database, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileInfoCardProps {
  filename: string
  fileSize: string
  totalRows?: number
  totalColumns?: number
  dataQuality?: number // 0-100
  fileType: string
  onDownload?: () => void
  onAnalyze?: () => void
  className?: string
}

export function FileInfoCard({
  filename,
  fileSize,
  totalRows,
  totalColumns,
  dataQuality,
  fileType,
  onDownload,
  onAnalyze,
  className,
}: FileInfoCardProps) {
  return (
    <Card className={cn('shadow-card', className)}>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* File Header */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{filename}</h3>
              <p className="text-sm text-muted-foreground">{fileSize} • {fileType}</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Database className="h-4 w-4" />
                <span className="text-xs font-medium">Total Rows</span>
              </div>
              <p className="text-2xl font-bold">{totalRows?.toLocaleString() || '-'}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <BarChart3 className="h-4 w-4" />
                <span className="text-xs font-medium">Columns</span>
              </div>
              <p className="text-2xl font-bold">{totalColumns || '-'}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-medium">Data Quality</span>
              </div>
              <p className="text-2xl font-bold">
                {dataQuality !== undefined ? `${dataQuality}%` : '-'}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span className="text-xs font-medium">File Type</span>
              </div>
              <p className="text-2xl font-bold">{fileType.toUpperCase()}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            {onDownload && (
              <Button variant="outline" onClick={onDownload} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
            {onAnalyze && (
              <Button onClick={onAnalyze} className="flex-1">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analyze
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
