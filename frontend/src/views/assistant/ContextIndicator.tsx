import { cn } from '@/lib/utils'
import { FileSpreadsheet, X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { FileContext } from '@/types/api'

interface ContextIndicatorProps {
  files: FileContext[]
  onRemoveFile: (fileId: number) => void
  onClear: () => void
}

export function ContextIndicator({
  files,
  onRemoveFile,
  onClear,
}: ContextIndicatorProps) {
  if (files.length === 0) return null

  return (
    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
      <span className="text-sm text-muted-foreground flex-shrink-0">
        Querying:
      </span>

      <div className="flex flex-wrap gap-1.5 flex-1">
        {files.map((file) => (
          <Badge
            key={file.file_id}
            variant="secondary"
            className="flex items-center gap-1 pr-1"
          >
            <FileSpreadsheet className="h-3 w-3" />
            <span className="max-w-32 truncate" title={file.filename}>
              {file.filename}
            </span>
            <button
              onClick={() => onRemoveFile(file.file_id)}
              className={cn(
                'ml-1 p-0.5 rounded-sm',
                'hover:bg-background/50 transition-colors'
              )}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      {files.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="flex-shrink-0 text-muted-foreground"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          Clear all
        </Button>
      )}
    </div>
  )
}
