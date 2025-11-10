import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Download, FileDown, CheckCircle2, AlertCircle } from 'lucide-react'
import { api, ApiError } from '@/services/api'
import type { ExportRequest } from '@/types'

interface ExportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  uploadId: string
  filename: string
}

type ExportState = 'idle' | 'exporting' | 'downloading' | 'completed' | 'error'

export function ExportModal({
  open,
  onOpenChange,
  uploadId,
  filename,
}: ExportModalProps) {
  const [state, setState] = useState<ExportState>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [progress, setProgress] = useState(0)

  const handleExport = async () => {
    try {
      setState('exporting')
      setProgress(30)
      setErrorMessage('')

      // Step 1: Request PDF generation
      const exportRequest: ExportRequest = {
        upload_id: uploadId,
        format: 'pdf',
        include_charts: true,
        include_insights: true,
      }

      const exportResponse = await api.exportDashboard(exportRequest)
      setProgress(60)

      // Step 2: Download the PDF
      setState('downloading')
      const blob = await api.downloadPDF(exportResponse.export_id)
      setProgress(90)

      // Step 3: Trigger browser download
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = exportResponse.filename || `${filename}_report.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setProgress(100)
      setState('completed')

      // Auto-close after 2 seconds
      setTimeout(() => {
        onOpenChange(false)
        resetState()
      }, 2000)
    } catch (error) {
      setState('error')
      if (error instanceof ApiError) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('An unexpected error occurred')
      }
    }
  }

  const resetState = () => {
    setState('idle')
    setProgress(0)
    setErrorMessage('')
  }

  const handleClose = () => {
    if (state !== 'exporting' && state !== 'downloading') {
      onOpenChange(false)
      resetState()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            Export Dashboard
          </DialogTitle>
          <DialogDescription>
            Export your dashboard with charts and AI insights as a PDF report
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Export Options Display */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Format:</span>
              <span className="font-medium">PDF</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Include Charts:</span>
              <span className="font-medium">Yes</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Include Insights:</span>
              <span className="font-medium">Yes</span>
            </div>
          </div>

          {/* Progress Display */}
          {(state === 'exporting' || state === 'downloading') && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">
                {state === 'exporting' && 'Generating PDF report...'}
                {state === 'downloading' && 'Downloading file...'}
              </p>
            </div>
          )}

          {/* Success Message */}
          {state === 'completed' && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                PDF exported successfully! Your download should start automatically.
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {state === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {errorMessage || 'Failed to export PDF. Please try again.'}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={state === 'exporting' || state === 'downloading'}
          >
            {state === 'completed' ? 'Close' : 'Cancel'}
          </Button>
          {state !== 'completed' && (
            <Button
              onClick={handleExport}
              disabled={state === 'exporting' || state === 'downloading'}
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
