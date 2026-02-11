import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { ChartCardView } from './ChartCardView'
import { LineChartView } from './LineChartView'
import { BarChartView } from './BarChartView'
import { PieChartView } from './PieChartView'
import { ScatterChartView } from './ScatterChartView'
import { useQuickChartInsight } from '@/services/api/mutations/useQuickChartInsight'
import { useChartInsight } from '@/services/api/mutations/useChartInsight'
import type { ChartData } from '@/types/api'

interface ChartGridViewProps {
  charts: ChartData[]
  uploadId?: string // For quick analysis (ephemeral uploads)
  fileId?: number // For project files (persisted)
  className?: string
}

export function ChartGridView({ charts, uploadId, fileId, className }: ChartGridViewProps) {
  // Track insights per chart (by index) - allows overriding initial null insights
  const [chartInsights, setChartInsights] = useState<Record<number, string>>({})
  // Track loading state per chart
  const [loadingInsights, setLoadingInsights] = useState<Record<number, boolean>>({})

  const quickInsightMutation = useQuickChartInsight()
  const fileInsightMutation = useChartInsight()

  const handleGenerateInsight = useCallback(
    async (chart: ChartData, index: number) => {
      // Must have either uploadId or fileId
      if (!uploadId && !fileId) return

      setLoadingInsights((prev) => ({ ...prev, [index]: true }))

      try {
        let insight: string

        if (fileId) {
          // Project file insight generation
          const result = await fileInsightMutation.mutateAsync({
            file_id: fileId,
            chart_type: chart.chart_type,
            chart_title: chart.title,
            chart_data: chart.data,
            x_column: chart.x_column,
            y_column: chart.y_column,
            category_column: chart.category_column,
            value_column: chart.value_column,
          })
          insight = result.insight
        } else {
          // Quick analysis insight generation
          const result = await quickInsightMutation.mutateAsync({
            upload_id: uploadId!,
            chart_type: chart.chart_type,
            chart_title: chart.title,
            chart_data: chart.data,
            x_column: chart.x_column,
            y_column: chart.y_column,
            category_column: chart.category_column,
            value_column: chart.value_column,
          })
          insight = result.insight
        }

        setChartInsights((prev) => ({ ...prev, [index]: insight }))
      } catch (error) {
        console.error('Failed to generate insight:', error)
      } finally {
        setLoadingInsights((prev) => ({ ...prev, [index]: false }))
      }
    },
    [uploadId, fileId, quickInsightMutation, fileInsightMutation]
  )

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
        'grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8',
        'stagger-children',
        className
      )}
    >
      {charts.map((chart, index) => {
        // Use local state insight if available, otherwise fall back to chart.insight
        const insight = chartInsights[index] ?? chart.insight
        const isLoading = loadingInsights[index] ?? false

        return (
          <ChartCardView
            key={index}
            title={chart.title}
            insight={insight}
            isLoadingInsight={isLoading}
            onGenerateInsight={
              uploadId || fileId ? () => handleGenerateInsight(chart, index) : undefined
            }
          >
            {renderChart(chart)}
          </ChartCardView>
        )
      })}
    </div>
  )
}
