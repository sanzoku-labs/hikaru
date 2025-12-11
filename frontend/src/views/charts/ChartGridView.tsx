import { cn } from '@/lib/utils'
import { ChartCardView } from './ChartCardView'
import { LineChartView } from './LineChartView'
import { BarChartView } from './BarChartView'
import { PieChartView } from './PieChartView'
import { ScatterChartView } from './ScatterChartView'
import type { ChartData } from '@/types/api'

interface ChartGridViewProps {
  charts: ChartData[]
  className?: string
}

export function ChartGridView({ charts, className }: ChartGridViewProps) {
  const renderChart = (chart: ChartData) => {
    switch (chart.chart_type) {
      case 'line':
        return <LineChartView chartData={chart} />
      case 'bar':
        return <BarChartView chartData={chart} />
      case 'pie':
        return <PieChartView chartData={chart} />
      case 'scatter':
        return <ScatterChartView chartData={chart} />
      default:
        return <div className="text-muted-foreground">Unknown chart type</div>
    }
  }

  return (
    <div
      className={cn(
        'grid grid-cols-1 lg:grid-cols-2 gap-6',
        'stagger-children',
        className
      )}
    >
      {charts.map((chart, index) => (
        <ChartCardView key={index} title={chart.title} insight={chart.insight}>
          {renderChart(chart)}
        </ChartCardView>
      ))}
    </div>
  )
}
