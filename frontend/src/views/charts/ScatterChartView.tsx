import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { ChartData } from '@/types/api'

interface ScatterChartViewProps {
  chartData: ChartData
}

// Hikaru color palette - hex for ECharts compatibility
const CHART_COLORS = {
  primary: '#F5A623',
  background: '#0F1218',
  border: '#1E2330',
  text: '#9CA3AF',
}

export function ScatterChartView({ chartData }: ScatterChartViewProps) {
  const option = useMemo(() => {
    const xColumn = chartData.x_column || ''
    const yColumn = chartData.y_column || ''

    const scatterData =
      chartData.data?.map((d) => [Number(d[xColumn]), Number(d[yColumn])]) || []

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: CHART_COLORS.background,
        borderColor: CHART_COLORS.border,
        textStyle: {
          color: '#F5F5F5',
          fontSize: 12,
        },
        formatter: (params: any) => {
          const [x, y] = params.data
          return `${xColumn}: ${x}<br/>${yColumn}: ${y}`
        },
      },
      grid: {
        left: '3%',
        right: '7%',
        bottom: '7%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        name: xColumn,
        nameLocation: 'middle',
        nameGap: 30,
        nameTextStyle: {
          color: CHART_COLORS.text,
          fontSize: 11,
        },
        axisLine: {
          lineStyle: { color: CHART_COLORS.border },
        },
        axisLabel: {
          color: CHART_COLORS.text,
          fontSize: 11,
        },
        splitLine: {
          lineStyle: { color: CHART_COLORS.border, type: 'dashed' },
        },
      },
      yAxis: {
        type: 'value',
        name: yColumn,
        nameLocation: 'middle',
        nameGap: 45,
        nameTextStyle: {
          color: CHART_COLORS.text,
          fontSize: 11,
        },
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
          type: 'scatter',
          data: scatterData,
          symbolSize: 10,
          itemStyle: {
            color: CHART_COLORS.primary,
            opacity: 0.8,
          },
          emphasis: {
            itemStyle: {
              opacity: 1,
              shadowBlur: 15,
              shadowColor: 'rgba(245, 166, 35, 0.5)',
              borderColor: 'white',
              borderWidth: 2,
            },
            scale: 1.5,
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
