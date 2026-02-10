import { useCallback, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Upload, FileSpreadsheet, X } from 'lucide-react'

interface FileUploaderViewProps {
  onFileSelect: (file: File) => void
  disabled?: boolean
  error?: string | null
}

const MAX_SIZE_MB = 30
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

export function FileUploaderView({
  onFileSelect,
  disabled,
  error,
}: FileUploaderViewProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
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

    // Check file size
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

      if (disabled) return

      const files = e.dataTransfer.files
      const file = files[0]
      if (file) {
        handleFile(file)
      }
    },
    [disabled, handleFile]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      const file = files?.[0]
      if (file) {
        handleFile(file)
      }
      // Reset input so same file can be selected again
      e.target.value = ''
    },
    [handleFile]
  )

  const displayError = error || validationError

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={cn(
          'relative flex flex-col items-center justify-center',
          'min-h-[280px] p-8',
          'border-2 border-dashed rounded-2xl',
          'transition-all duration-300 cursor-pointer',
          'bg-card/50',
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-border hover:border-primary/50 hover:bg-muted/30',
          disabled && 'opacity-50 cursor-not-allowed',
          displayError && 'border-destructive/50'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        tabIndex={0}
        role="button"
        aria-label="Select file to upload"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleInputChange}
          disabled={disabled}
          className="sr-only"
        />

        {/* Upload icon */}
        <div
          className={cn(
            'mb-6 p-5 rounded-2xl',
            'transition-all duration-300',
            isDragging
              ? 'bg-primary/20 text-primary scale-110'
              : 'bg-muted text-muted-foreground'
          )}
        >
          <Upload className="h-10 w-10" />
        </div>

        {/* Text */}
        <div className="text-center">
          <p className="text-lg font-medium text-foreground mb-2">
            {isDragging ? 'Drop your file here' : 'Drag and drop your file here'}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            or click to browse from your computer
          </p>

          {/* Accepted formats */}
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              CSV
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Excel (.xlsx)
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Maximum file size: {MAX_SIZE_MB}MB
          </p>
        </div>

        {/* Decorative gradient ring on hover */}
        {isDragging && (
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/10 via-transparent to-accent/10 pointer-events-none" />
        )}
      </div>

      {/* Error message */}
      {displayError && (
        <div className="mt-4 flex items-center gap-2 text-sm text-destructive animate-in-scale">
          <X className="h-4 w-4 flex-shrink-0" />
          {displayError}
        </div>
      )}
    </div>
  )
}
