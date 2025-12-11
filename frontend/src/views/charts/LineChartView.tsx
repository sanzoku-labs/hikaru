import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { ChartData } from '@/types/api'

interface LineChartViewProps {
  chartData: ChartData
}

// Hikaru color palette - warm amber tones (hex for ECharts compatibility)
const CHART_COLORS = {
  primary: '#F5A623',     // Primary amber
  accent: '#E8941C',      // Accent gold
  info: '#0EA5E9',        // Info blue
  success: '#22C55E',     // Success green
  purple: '#8B5CF6',      // Purple
  background: '#0F1218',  // Dark background
  border: '#1E2330',      // Border color
  text: '#9CA3AF',        // Muted text
}

export function LineChartView({ chartData }: LineChartViewProps) {
  const option = useMemo(() => {
    const xData = chartData.data?.map((d) => d[chartData.x_column || '']) || []
    const yData = chartData.data?.map((d) => d[chartData.y_column || '']) || []

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
