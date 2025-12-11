import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { ChartData } from '@/types/api'

interface ScatterChartViewProps {
  chartData: ChartData
}

// Hikaru primary color
const PRIMARY_COLOR = 'hsl(38, 92%, 55%)'

export function ScatterChartView({ chartData }: ScatterChartViewProps) {
  const option = useMemo(() => {
    const xColumn = chartData.x_column || ''
    const yColumn = chartData.y_column || ''

    const scatterData =
      chartData.data?.map((d) => [Number(d[xColumn]), Number(d[yColumn])]) || []

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'hsl(220, 25%, 9%)',
        borderColor: 'hsl(220, 20%, 16%)',
        textStyle: {
          color: 'hsl(40, 15%, 95%)',
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
          color: 'hsl(220, 10%, 55%)',
          fontSize: 11,
        },
        axisLine: {
          lineStyle: { color: 'hsl(220, 20%, 25%)' },
        },
        axisLabel: {
          color: 'hsl(220, 10%, 55%)',
          fontSize: 11,
        },
        splitLine: {
          lineStyle: { color: 'hsl(220, 20%, 16%)', type: 'dashed' },
        },
      },
      yAxis: {
        type: 'value',
        name: yColumn,
        nameLocation: 'middle',
        nameGap: 45,
        nameTextStyle: {
          color: 'hsl(220, 10%, 55%)',
          fontSize: 11,
        },
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
          type: 'scatter',
          data: scatterData,
          symbolSize: 10,
          itemStyle: {
            color: PRIMARY_COLOR,
            opacity: 0.8,
          },
          emphasis: {
            itemStyle: {
              opacity: 1,
              shadowBlur: 15,
              shadowColor: `${PRIMARY_COLOR}80`,
              borderColor: 'white',
              borderWidth: 2,
            },
            scale: 1.5,
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
