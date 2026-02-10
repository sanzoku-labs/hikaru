import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { ChartData } from '@/types/api'
import { useChartColors } from './chartTheme'

interface BarChartViewProps {
  chartData: ChartData
}

export function BarChartView({ chartData }: BarChartViewProps) {
  const { colors: CHART_COLORS } = useChartColors()

  const option = useMemo(() => {
    // Backend returns bar data as: { category: string, value: number }
    const categories = chartData.data?.map((d) => d.category ?? d[chartData.category_column || '']) || []
    const values = chartData.data?.map((d) => d.value ?? d[chartData.value_column || '']) || []

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: CHART_COLORS.background,
        borderColor: CHART_COLORS.border,
        textStyle: {
          color: '#F5F5F5',
          fontSize: 12,
        },
        axisPointer: {
          type: 'shadow',
          shadowStyle: {
            color: 'rgba(245, 166, 35, 0.08)',
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
          lineStyle: { color: CHART_COLORS.border },
        },
        axisLabel: {
          color: CHART_COLORS.text,
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
          color: CHART_COLORS.text,
          fontSize: 11,
        },
        splitLine: {
          lineStyle: { color: CHART_COLORS.border, type: 'dashed' },
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
                { offset: 0, color: CHART_COLORS.primary },
                { offset: 1, color: CHART_COLORS.accent },
              ],
            },
            borderRadius: [6, 6, 0, 0],
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 15,
              shadowColor: 'rgba(245, 166, 35, 0.4)',
            },
          },
        },
      ],
      animation: true,
      animationDuration: 600,
      animationEasing: 'cubicInOut',
    }
  }, [chartData, CHART_COLORS])

  return (
    <ReactECharts
      option={option}
      style={{ height: '320px', width: '100%' }}
      opts={{ renderer: 'canvas' }}
      notMerge
    />
  )
}
