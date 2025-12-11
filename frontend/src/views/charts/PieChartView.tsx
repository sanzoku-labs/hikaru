import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { ChartData } from '@/types/api'

interface PieChartViewProps {
  chartData: ChartData
}

// Hikaru color palette - gradient progression
const CHART_COLORS = [
  'hsl(38, 92%, 55%)',    // Primary amber
  'hsl(32, 95%, 50%)',    // Accent gold
  'hsl(199, 89%, 48%)',   // Info blue
  'hsl(142, 71%, 45%)',   // Success green
  'hsl(262, 83%, 58%)',   // Purple
  'hsl(0, 72%, 51%)',     // Red
  'hsl(25, 95%, 53%)',    // Orange
  'hsl(173, 80%, 40%)',   // Teal
]

export function PieChartView({ chartData }: PieChartViewProps) {
  const option = useMemo(() => {
    const categoryColumn = chartData.category_column || ''
    const valueColumn = chartData.value_column || ''

    const pieData =
      chartData.data?.map((d, i) => ({
        name: String(d[categoryColumn]),
        value: Number(d[valueColumn]),
        itemStyle: {
          color: CHART_COLORS[i % CHART_COLORS.length],
        },
      })) || []

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'hsl(220, 25%, 9%)',
        borderColor: 'hsl(220, 20%, 16%)',
        textStyle: {
          color: 'hsl(40, 15%, 95%)',
          fontSize: 12,
        },
        formatter: '{b}: {c} ({d}%)',
      },
      legend: {
        type: 'scroll',
        orient: 'horizontal',
        bottom: 0,
        left: 'center',
        textStyle: {
          color: 'hsl(220, 10%, 55%)',
          fontSize: 11,
        },
        pageTextStyle: {
          color: 'hsl(220, 10%, 55%)',
        },
        pageIconColor: 'hsl(38, 92%, 55%)',
        pageIconInactiveColor: 'hsl(220, 20%, 30%)',
      },
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'], // Donut chart
          center: ['50%', '45%'],
          avoidLabelOverlap: true,
          padAngle: 2,
          itemStyle: {
            borderRadius: 6,
            borderColor: 'hsl(220, 25%, 9%)',
            borderWidth: 2,
          },
          label: {
            show: false,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 600,
              color: 'hsl(40, 15%, 95%)',
            },
            itemStyle: {
              shadowBlur: 20,
              shadowColor: 'rgba(0, 0, 0, 0.3)',
            },
          },
          labelLine: {
            show: false,
          },
          data: pieData,
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
