import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ReactECharts from 'echarts-for-react'
import type { ChartData } from '@/types'
import type { EChartsOption } from 'echarts'

interface ChartCardProps {
  chart: ChartData
}

export function ChartCard({ chart }: ChartCardProps) {
  const getChartOption = (): EChartsOption => {
    switch (chart.chart_type) {
      case 'line':
        return {
          title: {
            text: chart.title,
            left: 'center',
          },
          tooltip: {
            trigger: 'axis',
          },
          xAxis: {
            type: 'category',
            data: chart.data.map(d => d.x),
            name: chart.x_column,
          },
          yAxis: {
            type: 'value',
            name: chart.y_column,
          },
          series: [
            {
              data: chart.data.map(d => d.y),
              type: 'line',
              smooth: true,
            },
          ],
        }

      case 'bar':
        return {
          title: {
            text: chart.title,
            left: 'center',
          },
          tooltip: {
            trigger: 'axis',
          },
          xAxis: {
            type: 'category',
            data: chart.data.map(d => d.category),
            name: chart.category_column,
            axisLabel: {
              rotate: 45,
            },
          },
          yAxis: {
            type: 'value',
            name: chart.value_column,
          },
          series: [
            {
              data: chart.data.map(d => d.value),
              type: 'bar',
            },
          ],
        }

      case 'pie':
        return {
          title: {
            text: chart.title,
            left: 'center',
          },
          tooltip: {
            trigger: 'item',
            formatter: '{b}: {c} ({d}%)',
          },
          legend: {
            orient: 'vertical',
            left: 'left',
          },
          series: [
            {
              type: 'pie',
              radius: '50%',
              data: chart.data.map(d => ({
                name: d.name,
                value: d.value,
              })),
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: 'rgba(0, 0, 0, 0.5)',
                },
              },
            },
          ],
        }

      case 'scatter':
        return {
          title: {
            text: chart.title,
            left: 'center',
          },
          tooltip: {
            trigger: 'item',
          },
          xAxis: {
            type: 'value',
            name: chart.x_column,
          },
          yAxis: {
            type: 'value',
            name: chart.y_column,
          },
          series: [
            {
              data: chart.data.map(d => [d.x, d.y]),
              type: 'scatter',
              symbolSize: 8,
            },
          ],
        }

      default:
        return {}
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">{chart.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ReactECharts
          option={getChartOption()}
          style={{ height: '400px', width: '100%' }}
          opts={{ renderer: 'canvas' }}
        />

        {chart.insight && (
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground italic">
              <span className="font-semibold text-foreground">AI Insight: </span>
              {chart.insight}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
