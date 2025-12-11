import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { ChartData } from '@/types/api'

interface PieChartViewProps {
  chartData: ChartData
}

// Hikaru color palette - hex for ECharts compatibility
const PIE_COLORS = [
  '#F5A623',  // Primary amber
  '#E8941C',  // Accent gold
  '#0EA5E9',  // Info blue
  '#22C55E',  // Success green
  '#8B5CF6',  // Purple
  '#EF4444',  // Red
  '#F97316',  // Orange
  '#14B8A6',  // Teal
]

const CHART_COLORS = {
  background: '#0F1218',
  border: '#1E2330',
  text: '#9CA3AF',
}

export function PieChartView({ chartData }: PieChartViewProps) {
  const option = useMemo(() => {
    const categoryColumn = chartData.category_column || ''
    const valueColumn = chartData.value_column || ''

    const pieData =
      chartData.data?.map((d, i) => ({
        name: String(d[categoryColumn]),
        value: Number(d[valueColumn]),
        itemStyle: {
          color: PIE_COLORS[i % PIE_COLORS.length],
        },
      })) || []

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: CHART_COLORS.background,
        borderColor: CHART_COLORS.border,
        textStyle: {
          color: '#F5F5F5',
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
          color: CHART_COLORS.text,
          fontSize: 11,
        },
        pageTextStyle: {
          color: CHART_COLORS.text,
        },
        pageIconColor: PIE_COLORS[0],
        pageIconInactiveColor: '#374151',
      },
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: true,
          padAngle: 2,
          itemStyle: {
            borderRadius: 6,
            borderColor: CHART_COLORS.background,
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
              color: '#F5F5F5',
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
