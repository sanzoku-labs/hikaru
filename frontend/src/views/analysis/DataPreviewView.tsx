import { cn } from '@/lib/utils'
import { Table, Hash, Calendar, Type } from 'lucide-react'
import type { DataSchema } from '@/types/api'
import { ScrollArea } from '@/components/ui/scroll-area'

interface DataPreviewViewProps {
  fileName?: string
  dataSchema: DataSchema
  showHeader?: boolean
}

function getColumnIcon(type: string) {
  switch (type) {
    case 'numeric':
      return Hash
    case 'datetime':
      return Calendar
    case 'categorical':
    default:
      return Type
  }
}

function getColumnTypeColor(type: string) {
  switch (type) {
    case 'numeric':
      return 'text-blue-500 bg-blue-500/10'
    case 'datetime':
      return 'text-purple-500 bg-purple-500/10'
    case 'categorical':
    default:
      return 'text-emerald-500 bg-emerald-500/10'
  }
}

export function DataPreviewView({
  dataSchema,
  showHeader = true,
}: DataPreviewViewProps) {
  return (
    <div className="w-full animate-in-up">
      {/* Header - conditionally shown */}
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Data Schema</h3>
            <p className="text-sm text-muted-foreground">
              {dataSchema.row_count.toLocaleString()} rows · {dataSchema.columns.length} columns
            </p>
          </div>
        </div>
      )}

      {/* Schema cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {dataSchema.columns.map((column) => {
          const Icon = getColumnIcon(column.type)
          const colorClass = getColumnTypeColor(column.type)

          return (
            <div
              key={column.name}
              className={cn(
                'p-4 rounded-xl',
                'bg-card border border-border',
                'transition-all duration-200',
                'hover:border-primary/30 hover:shadow-sm'
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn('p-2 rounded-lg', colorClass)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate" title={column.name}>
                    {column.name}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize mt-0.5">
                    {column.type}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Unique</span>
                  <span className="text-foreground font-medium">
                    {column.unique_values?.toLocaleString() || '—'}
                  </span>
                </div>
                {column.null_count !== undefined && column.null_count > 0 && (
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-muted-foreground">Missing</span>
                    <span className="text-amber-500 font-medium">
                      {column.null_count.toLocaleString()}
                    </span>
                  </div>
                )}
                {column.type === 'numeric' && column.mean !== undefined && (
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-muted-foreground">Mean</span>
                    <span className="text-foreground font-medium">
                      {typeof column.mean === 'number'
                        ? column.mean.toLocaleString(undefined, { maximumFractionDigits: 2 })
                        : '—'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Data preview table */}
      {dataSchema.preview && dataSchema.preview.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Table className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium text-foreground">Data Preview</h4>
            <span className="text-xs text-muted-foreground">
              (First {dataSchema.preview.length} rows)
            </span>
          </div>

          <div className="rounded-xl border border-border overflow-hidden">
            <ScrollArea className="w-full overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    {dataSchema.columns.map((col) => (
                      <th
                        key={col.name}
                        className="px-4 py-3 text-left font-medium text-foreground whitespace-nowrap"
                      >
                        {col.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataSchema.preview.map((row, i) => (
                    <tr
                      key={i}
                      className={cn(
                        'border-b border-border last:border-0',
                        'hover:bg-muted/30 transition-colors'
                      )}
                    >
                      {dataSchema.columns.map((col) => (
                        <td
                          key={col.name}
                          className="px-4 py-3 text-muted-foreground whitespace-nowrap max-w-[200px] truncate"
                          title={String(row[col.name] ?? '')}
                        >
                          {row[col.name] !== null && row[col.name] !== undefined
                            ? String(row[col.name])
                            : '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  )
}
