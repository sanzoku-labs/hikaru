import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { ChartData } from '@/types/api'
import { useChartColors } from './chartTheme'

interface LineChartViewProps {
  chartData: ChartData
}

export function LineChartView({ chartData }: LineChartViewProps) {
  const { colors: CHART_COLORS } = useChartColors()

  const option = useMemo(() => {
    // Backend returns line data as: { x: value, y: value } or column-based
    const xData = chartData.data?.map((d) => d.x ?? d[chartData.x_column || '']) || []
    const yData = chartData.data?.map((d) => d.y ?? d[chartData.y_column || '']) || []

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
          type: 'cross',
          lineStyle: {
            color: CHART_COLORS.primary,
            opacity: 0.3,
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
        data: xData,
        axisLine: {
          lineStyle: { color: CHART_COLORS.border },
        },
        axisLabel: {
          color: CHART_COLORS.text,
          fontSize: 11,
          rotate: xData.length > 10 ? 45 : 0,
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
          data: yData,
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            color: CHART_COLORS.primary,
            width: 3,
          },
          itemStyle: {
            color: CHART_COLORS.primary,
            borderWidth: 2,
            borderColor: CHART_COLORS.background,
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(245, 166, 35, 0.25)' },
                { offset: 1, color: 'rgba(245, 166, 35, 0.02)' },
              ],
            },
          },
          emphasis: {
            focus: 'series',
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(245, 166, 35, 0.5)',
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
