import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { DataSchema } from '@/types'

interface DataPreviewProps {
  schema: DataSchema
  filename: string
}

export function DataPreview({ schema, filename }: DataPreviewProps) {
  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'numeric':
        return 'default' as const
      case 'categorical':
        return 'secondary' as const
      case 'datetime':
        return 'outline' as const
      default:
        return 'outline' as const
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Data Preview</CardTitle>
        <CardDescription>
          {filename} • {schema.row_count.toLocaleString()} rows • {schema.columns.length} columns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto max-h-[600px] w-full rounded-md border">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                {schema.columns.map((col) => (
                  <TableHead key={col.name} className="min-w-[150px] whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">{col.name}</span>
                      <Badge variant={getTypeBadgeVariant(col.type)} className="w-fit">
                        {col.type}
                      </Badge>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {schema.preview.map((row, idx) => (
                <TableRow key={idx}>
                  {schema.columns.map((col) => (
                    <TableCell key={`${idx}-${col.name}`} className="min-w-[150px] whitespace-nowrap">
                      {row[col.name] != null ? String(row[col.name]) : (
                        <span className="text-muted-foreground italic">null</span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
