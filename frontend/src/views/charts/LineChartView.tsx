import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { ChartData } from '@/types/api'

interface LineChartViewProps {
  chartData: ChartData
}

// Hikaru color palette - warm amber tones
const CHART_COLORS = [
  'hsl(38, 92%, 55%)',    // Primary amber
  'hsl(32, 95%, 50%)',    // Accent gold
  'hsl(199, 89%, 48%)',   // Info blue
  'hsl(142, 71%, 45%)',   // Success green
  'hsl(262, 83%, 58%)',   // Purple
]

export function LineChartView({ chartData }: LineChartViewProps) {
  const option = useMemo(() => {
    const xData = chartData.data?.map((d) => d[chartData.x_column || '']) || []
    const yData = chartData.data?.map((d) => d[chartData.y_column || '']) || []

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
          type: 'cross',
          lineStyle: {
            color: CHART_COLORS[0],
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
          lineStyle: { color: 'hsl(220, 20%, 25%)' },
        },
        axisLabel: {
          color: 'hsl(220, 10%, 55%)',
          fontSize: 11,
          rotate: xData.length > 10 ? 45 : 0,
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
          data: yData,
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            color: CHART_COLORS[0],
            width: 3,
          },
          itemStyle: {
            color: CHART_COLORS[0],
            borderWidth: 2,
            borderColor: 'hsl(220, 25%, 9%)',
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: `${CHART_COLORS[0]}40` },
                { offset: 1, color: `${CHART_COLORS[0]}05` },
              ],
            },
          },
          emphasis: {
            focus: 'series',
            itemStyle: {
              shadowBlur: 10,
              shadowColor: `${CHART_COLORS[0]}80`,
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
