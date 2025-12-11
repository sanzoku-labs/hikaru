import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { ChartData } from '@/types/api'

interface BarChartViewProps {
  chartData: ChartData
}

// Hikaru color palette
const CHART_COLORS = [
  'hsl(38, 92%, 55%)',    // Primary amber
  'hsl(32, 95%, 50%)',    // Accent gold
  'hsl(199, 89%, 48%)',   // Info blue
  'hsl(142, 71%, 45%)',   // Success green
  'hsl(262, 83%, 58%)',   // Purple
]

export function BarChartView({ chartData }: BarChartViewProps) {
  const option = useMemo(() => {
    const categoryColumn = chartData.category_column || chartData.x_column || ''
    const valueColumn = chartData.value_column || chartData.y_column || ''

    const categories = chartData.data?.map((d) => d[categoryColumn]) || []
    const values = chartData.data?.map((d) => d[valueColumn]) || []

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'hsl(220, 25%, 9%)',
        borderColor: 'hsl(220, 20%, 16%)',
        textStyle: {
          color: 'hsl(40, 15%, 95%)',
          fontSize: 12,
        },
        axisPointer: {
          type: 'shadow',
          shadowStyle: {
            color: `${CHART_COLORS[0]}15`,
          },
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: categories,
        axisLine: {
          lineStyle: { color: 'hsl(220, 20%, 25%)' },
        },
        axisLabel: {
          color: 'hsl(220, 10%, 55%)',
          fontSize: 11,
          rotate: categories.length > 6 ? 45 : 0,
          interval: 0,
        },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisLabel: {
          color: 'hsl(220, 10%, 55%)',
          fontSize: 11,
        },
        splitLine: {
          lineStyle: { color: 'hsl(220, 20%, 16%)', type: 'dashed' },
        },
      },
      series: [
        {
          data: values,
          type: 'bar',
          barWidth: '60%',
          barMaxWidth: 50,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: CHART_COLORS[0] },
                { offset: 1, color: CHART_COLORS[1] },
              ],
            },
            borderRadius: [6, 6, 0, 0],
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 15,
              shadowColor: `${CHART_COLORS[0]}60`,
            },
          },
        },
      ],
      animation: true,
      animationDuration: 800,
      animationEasing: 'cubicOut',
    }
  }, [chartData])

  return (
    <ReactECharts
      option={option}
      style={{ height: '320px', width: '100%' }}
      opts={{ renderer: 'canvas' }}
      notMerge
    />
  )
}
