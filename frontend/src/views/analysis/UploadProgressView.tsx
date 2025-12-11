import { cn } from '@/lib/utils'
import { formatFileSize } from '@/lib/utils'
import { FileSpreadsheet, Upload, Cpu, Sparkles, Check, X } from 'lucide-react'
import type { UploadStage } from '@/hooks/analysis/useQuickAnalysisFlow'

interface UploadProgressViewProps {
  fileName: string
  fileSize: number
  stage: UploadStage
  error?: string
}

const stages = [
  { key: 'uploading', label: 'Uploading', icon: Upload },
  { key: 'processing', label: 'Processing', icon: Cpu },
  { key: 'analyzing', label: 'Analyzing', icon: Sparkles },
  { key: 'complete', label: 'Complete', icon: Check },
]

export function UploadProgressView({
  fileName,
  fileSize,
  stage,
  error,
}: UploadProgressViewProps) {
  const currentIndex = stages.findIndex((s) => s.key === stage)
  const isError = stage === 'error'

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* File info card */}
      <div
        className={cn(
          'flex items-center gap-4 p-4 rounded-xl mb-8',
          'bg-card border border-border',
          'animate-in-scale'
        )}
      >
        <div
          className={cn(
            'flex-shrink-0 p-3 rounded-lg',
            isError ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
          )}
        >
          <FileSpreadsheet className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{fileName}</p>
          <p className="text-sm text-muted-foreground">{formatFileSize(fileSize)}</p>
        </div>
        {isError && <X className="h-5 w-5 text-destructive flex-shrink-0" />}
        {stage === 'complete' && (
          <div className="flex-shrink-0 p-1.5 rounded-full bg-green-500/10 text-green-500">
            <Check className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Error state */}
      {isError && error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm mb-8 animate-in-scale">
          {error}
        </div>
      )}

      {/* Progress stages */}
      {!isError && (
        <div className="relative">
          {/* Connection line */}
          <div className="absolute top-6 left-6 right-6 h-0.5 bg-border">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{
                width: `${Math.min(100, (currentIndex / (stages.length - 1)) * 100)}%`,
              }}
            />
          </div>

          {/* Stage indicators */}
          <div className="relative flex justify-between">
            {stages.map((s, i) => {
              const Icon = s.icon
              const isActive = s.key === stage
              const isComplete = currentIndex > i || stage === 'complete'
              return (
                <div key={s.key} className="flex flex-col items-center">
                  <div
                    className={cn(
                      'relative z-10 flex items-center justify-center',
                      'w-12 h-12 rounded-full',
                      'transition-all duration-300',
                      isComplete
                        ? 'bg-primary text-primary-foreground'
                        : isActive
                        ? 'bg-primary/20 text-primary ring-4 ring-primary/20'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {isActive && !isComplete && (
                      <div className="absolute inset-0 rounded-full animate-ping bg-primary/30" />
                    )}
                    <Icon className={cn('h-5 w-5', isActive && 'animate-pulse')} />
                  </div>
                  <span
                    className={cn(
                      'mt-3 text-sm font-medium transition-colors duration-300',
                      isComplete || isActive ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {s.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Status message */}
      {!isError && stage !== 'complete' && (
        <p className="mt-8 text-center text-sm text-muted-foreground animate-pulse">
          {stage === 'uploading' && 'Uploading your file...'}
          {stage === 'processing' && 'Processing data schema...'}
          {stage === 'analyzing' && 'Generating charts and AI insights...'}
        </p>
      )}

      {stage === 'complete' && (
        <p className="mt-8 text-center text-sm text-green-500 animate-in-fade">
          Analysis complete! Scroll down to see your results.
        </p>
      )}
    </div>
  )
}
