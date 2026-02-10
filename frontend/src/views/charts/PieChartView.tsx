import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { ChartData } from '@/types/api'
import { useChartColors } from './chartTheme'

interface PieChartViewProps {
  chartData: ChartData
}

export function PieChartView({ chartData }: PieChartViewProps) {
  const { colors: CHART_COLORS, pieColors: PIE_COLORS } = useChartColors()

  const option = useMemo(() => {
    // Backend returns pie data as: { name: string, value: number }
    const pieData =
      chartData.data?.map((d, i) => ({
        name: String(d.name ?? d[chartData.category_column || '']),
        value: Number(d.value ?? d[chartData.value_column || '']),
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
  }, [chartData, CHART_COLORS, PIE_COLORS])

  return (
    <ReactECharts
      option={option}
      style={{ height: '320px', width: '100%' }}
      opts={{ renderer: 'canvas' }}
      notMerge
    />
  )
}
