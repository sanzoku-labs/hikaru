import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { OverlayChartData } from '@/types/api'

interface OverlayChartViewProps {
  chart: OverlayChartData
}

// Colors for the two files being compared
const FILE_COLORS = {
  fileA: '#3B82F6', // Blue
  fileB: '#A855F7', // Purple
  background: '#0F1218',
  border: '#1E2330',
  text: '#9CA3AF',
}

export function OverlayChartView({ chart }: OverlayChartViewProps) {
  const option = useMemo(() => {
    // Extract x and y values from both datasets
    const xColumn = chart.x_column
    const yColumn = chart.y_column

    const dataA = chart.file_a_data || []
    const dataB = chart.file_b_data || []

    // For line/bar charts, use x values as categories
    // Merge x values from both files for complete axis
    const xValuesA = dataA.map((d) => String(d[xColumn] ?? ''))
    const xValuesB = dataB.map((d) => String(d[xColumn] ?? ''))
    const allXValues = [...new Set([...xValuesA, ...xValuesB])]

    // Map y values to the combined x axis
    const yValuesA = allXValues.map((x) => {
      const point = dataA.find((d) => String(d[xColumn]) === x)
      return point ? Number(point[yColumn]) || 0 : null
    })

    const yValuesB = allXValues.map((x) => {
      const point = dataB.find((d) => String(d[xColumn]) === x)
      return point ? Number(point[yColumn]) || 0 : null
    })

    const isLineChart = chart.chart_type === 'line'
    const isBarChart = chart.chart_type === 'bar'
    const isScatterChart = chart.chart_type === 'scatter'

    // Base config
    const baseOption = {
      tooltip: {
        trigger: isScatterChart ? 'item' : 'axis',
        backgroundColor: FILE_COLORS.background,
        borderColor: FILE_COLORS.border,
        textStyle: {
          color: '#F5F5F5',
          fontSize: 12,
        },
      },
      legend: {
        data: [chart.file_a_name, chart.file_b_name],
        top: 0,
        textStyle: {
          color: FILE_COLORS.text,
          fontSize: 11,
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true,
      },
      animation: true,
      animationDuration: 600,
    }

    // Line chart config
    if (isLineChart) {
      return {
        ...baseOption,
        xAxis: {
          type: 'category',
          data: allXValues,
          axisLine: { lineStyle: { color: FILE_COLORS.border } },
          axisLabel: {
            color: FILE_COLORS.text,
            fontSize: 11,
            rotate: allXValues.length > 10 ? 45 : 0,
          },
          axisTick: { show: false },
        },
        yAxis: {
          type: 'value',
          axisLine: { show: false },
          axisLabel: { color: FILE_COLORS.text, fontSize: 11 },
          splitLine: { lineStyle: { color: FILE_COLORS.border, type: 'dashed' } },
        },
        series: [
          {
            name: chart.file_a_name,
            data: yValuesA,
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            lineStyle: { color: FILE_COLORS.fileA, width: 2 },
            itemStyle: { color: FILE_COLORS.fileA },
            connectNulls: true,
          },
          {
            name: chart.file_b_name,
            data: yValuesB,
            type: 'line',
            smooth: true,
            symbol: 'diamond',
            symbolSize: 6,
            lineStyle: { color: FILE_COLORS.fileB, width: 2 },
            itemStyle: { color: FILE_COLORS.fileB },
            connectNulls: true,
          },
        ],
      }
    }

    // Bar chart config (grouped bars)
    if (isBarChart) {
      return {
        ...baseOption,
        xAxis: {
          type: 'category',
          data: allXValues,
          axisLine: { lineStyle: { color: FILE_COLORS.border } },
          axisLabel: {
            color: FILE_COLORS.text,
            fontSize: 11,
            rotate: allXValues.length > 6 ? 45 : 0,
          },
          axisTick: { show: false },
        },
        yAxis: {
          type: 'value',
          axisLine: { show: false },
          axisLabel: { color: FILE_COLORS.text, fontSize: 11 },
          splitLine: { lineStyle: { color: FILE_COLORS.border, type: 'dashed' } },
        },
        series: [
          {
            name: chart.file_a_name,
            data: yValuesA,
            type: 'bar',
            barGap: '10%',
            itemStyle: {
              color: FILE_COLORS.fileA,
              borderRadius: [4, 4, 0, 0],
            },
          },
          {
            name: chart.file_b_name,
            data: yValuesB,
            type: 'bar',
            itemStyle: {
              color: FILE_COLORS.fileB,
              borderRadius: [4, 4, 0, 0],
            },
          },
        ],
      }
    }

    // Scatter chart config
    if (isScatterChart) {
      const scatterDataA = dataA.map((d) => [
        Number(d[xColumn]) || 0,
        Number(d[yColumn]) || 0,
      ])
      const scatterDataB = dataB.map((d) => [
        Number(d[xColumn]) || 0,
        Number(d[yColumn]) || 0,
      ])

      return {
        ...baseOption,
        xAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: FILE_COLORS.border } },
          axisLabel: { color: FILE_COLORS.text, fontSize: 11 },
          splitLine: { lineStyle: { color: FILE_COLORS.border, type: 'dashed' } },
        },
        yAxis: {
          type: 'value',
          axisLine: { show: false },
          axisLabel: { color: FILE_COLORS.text, fontSize: 11 },
          splitLine: { lineStyle: { color: FILE_COLORS.border, type: 'dashed' } },
        },
        series: [
          {
            name: chart.file_a_name,
            data: scatterDataA,
            type: 'scatter',
            symbolSize: 8,
            itemStyle: { color: FILE_COLORS.fileA },
          },
          {
            name: chart.file_b_name,
            data: scatterDataB,
            type: 'scatter',
            symbolSize: 8,
            itemStyle: { color: FILE_COLORS.fileB },
          },
        ],
      }
    }

    // Default: line chart
    return {
      ...baseOption,
      xAxis: {
        type: 'category',
        data: allXValues,
        axisLine: { lineStyle: { color: FILE_COLORS.border } },
        axisLabel: { color: FILE_COLORS.text, fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisLabel: { color: FILE_COLORS.text, fontSize: 11 },
        splitLine: { lineStyle: { color: FILE_COLORS.border, type: 'dashed' } },
      },
      series: [
        {
          name: chart.file_a_name,
          data: yValuesA,
          type: 'line',
          itemStyle: { color: FILE_COLORS.fileA },
        },
        {
          name: chart.file_b_name,
          data: yValuesB,
          type: 'line',
          itemStyle: { color: FILE_COLORS.fileB },
        },
      ],
    }
  }, [chart])

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{chart.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Chart */}
        <div className="px-4 pb-2">
          <ReactECharts
            option={option}
            style={{ height: '320px', width: '100%' }}
            opts={{ renderer: 'canvas' }}
            notMerge
          />
        </div>

        {/* AI Insight */}
        {chart.comparison_insight && (
          <div className="px-4 pb-4 pt-2 border-t border-border mt-2">
            <div className="flex gap-2">
              <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                {chart.comparison_insight}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
