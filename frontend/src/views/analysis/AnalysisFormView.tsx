import { useCallback, useState } from 'react'
import { cn } from '@/lib/utils'
import { Upload, FileSpreadsheet, X, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface AnalysisFormViewProps {
  selectedFile: File | null
  userIntent: string
  error?: string | null
  canSubmit: boolean
  onFileSelect: (file: File) => void
  onFileRemove: () => void
  onUserIntentChange: (intent: string) => void
  onSubmit: () => void
  submitLabel?: string
}

const MAX_SIZE_MB = 30
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AnalysisFormView({
  selectedFile,
  userIntent,
  error,
  canSubmit,
  onFileSelect,
  onFileRemove,
  onUserIntentChange,
  onSubmit,
  submitLabel = 'Analyze Data',
}: AnalysisFormViewProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const validateFile = useCallback((file: File): string | null => {
    const isValidType =
      file.type === 'text/csv' ||
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel' ||
      file.name.endsWith('.csv') ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls')

    if (!isValidType) {
      return 'Please upload a CSV or Excel file'
    }

    if (file.size > MAX_SIZE_BYTES) {
      return `File size must be less than ${MAX_SIZE_MB}MB`
    }

    return null
  }, [])

  const handleFile = useCallback(
    (file: File) => {
      setValidationError(null)
      const error = validateFile(file)
      if (error) {
        setValidationError(error)
        return
      }
      onFileSelect(file)
    },
    [validateFile, onFileSelect]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const files = e.dataTransfer.files
      const file = files[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      const file = files?.[0]
      if (file) {
        handleFile(file)
      }
      e.target.value = ''
    },
    [handleFile]
  )

  const handleFormSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (canSubmit) {
        onSubmit()
      }
    },
    [canSubmit, onSubmit]
  )

  const displayError = error || validationError

  return (
    <form onSubmit={handleFormSubmit} className="w-full max-w-2xl mx-auto space-y-6">
      {/* File Upload Section */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">
          Data File <span className="text-destructive">*</span>
        </Label>

        {!selectedFile ? (
          // Upload zone when no file selected
          <label
            className={cn(
              'relative flex flex-col items-center justify-center',
              'min-h-[200px] p-6',
              'border-2 border-dashed rounded-xl',
              'transition-all duration-300 cursor-pointer',
              'bg-card/50',
              isDragging
                ? 'border-primary bg-primary/5 scale-[1.01]'
                : 'border-border hover:border-primary/50 hover:bg-muted/30',
              displayError && 'border-destructive/50'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleInputChange}
              className="sr-only"
            />

            <div
              className={cn(
                'mb-4 p-4 rounded-xl',
                'transition-all duration-300',
                isDragging
                  ? 'bg-primary/20 text-primary scale-110'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              <Upload className="h-8 w-8" />
            </div>

            <div className="text-center">
              <p className="text-base font-medium text-foreground mb-1">
                {isDragging ? 'Drop your file here' : 'Drag and drop your file here'}
              </p>
              <p className="text-sm text-muted-foreground mb-3">
                or click to browse from your computer
              </p>

              <div className="flex items-center justify-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs">
                  <FileSpreadsheet className="h-3 w-3" />
                  CSV
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs">
                  <FileSpreadsheet className="h-3 w-3" />
                  Excel
                </div>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                Maximum file size: {MAX_SIZE_MB}MB
              </p>
            </div>

            {isDragging && (
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/10 via-transparent to-accent/10 pointer-events-none" />
            )}
          </label>
        ) : (
          // Selected file display
          <div className="flex items-center gap-3 p-4 rounded-xl border bg-card">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onFileRemove}
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {displayError && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <X className="h-4 w-4 flex-shrink-0" />
            {displayError}
          </div>
        )}
      </div>

      {/* User Intent Section */}
      <div className="space-y-2">
        <Label htmlFor="user-intent" className="text-sm font-medium text-foreground">
          What would you like to learn from this data?
          <span className="text-muted-foreground font-normal ml-1">(optional)</span>
        </Label>
        <Textarea
          id="user-intent"
          placeholder="e.g., Show me sales trends over time, or Find correlations between customer age and purchase amount..."
          value={userIntent}
          onChange={(e) => onUserIntentChange(e.target.value)}
          className="min-h-[100px] resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Guide the AI analysis by describing what insights you're looking for
        </p>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!canSubmit}
        size="lg"
        className="w-full"
      >
        <Sparkles className="h-4 w-4" />
        {submitLabel}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  )
}
