import { ChartCard } from '@/components/ChartCard'
import { Skeleton } from '@/components/ui/skeleton'
import type { ChartData } from '@/types'

interface ChartGridProps {
  charts: ChartData[]
  loading?: boolean
  fileId?: number // Optional file ID for advanced insights
}

export function ChartGrid({ charts, loading = false, fileId }: ChartGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[500px] w-full" />
        ))}
      </div>
    )
  }

  if (charts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No charts generated. Please upload a data file to begin.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {charts.map((chart, index) => (
        <ChartCard key={index} chart={chart} fileId={fileId} />
      ))}
    </div>
  )
}
