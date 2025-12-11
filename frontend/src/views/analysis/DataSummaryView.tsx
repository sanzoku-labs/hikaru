import { useState } from 'react'
import { cn } from '@/lib/utils'
import { FileSpreadsheet, ChevronDown, ChevronUp, Rows3, Columns3 } from 'lucide-react'
import { DataPreviewView } from './DataPreviewView'
import type { DataSchema } from '@/types/api'

interface DataSummaryViewProps {
  fileName: string
  dataSchema: DataSchema
  className?: string
}

export function DataSummaryView({
  fileName,
  dataSchema,
  className,
}: DataSummaryViewProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const columnCount = dataSchema.columns.length
  const rowCount = dataSchema.row_count

  return (
    <div className={cn('rounded-xl border bg-card', className)}>
      {/* Minimal summary bar */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between',
          'px-4 py-3',
          'text-left transition-colors',
          'hover:bg-muted/50',
          isExpanded && 'border-b'
        )}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <FileSpreadsheet className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-4">
            <span className="font-medium text-foreground">{fileName}</span>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Rows3 className="h-3.5 w-3.5" />
                {rowCount.toLocaleString()} rows
              </span>
              <span className="flex items-center gap-1">
                <Columns3 className="h-3.5 w-3.5" />
                {columnCount} columns
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{isExpanded ? 'Hide' : 'View'} details</span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="p-4 animate-in slide-in-from-top-2 duration-200">
          <DataPreviewView
            fileName={fileName}
            dataSchema={dataSchema}
            showHeader={false}
          />
        </div>
      )}
    </div>
  )
}
