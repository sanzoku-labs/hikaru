import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Lightbulb, Loader2 } from 'lucide-react'
import ReactECharts from 'echarts-for-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ChartData, ChartInsightRequest } from '@/types'
import type { EChartsOption } from 'echarts'
import { api } from '@/services/api'

interface ChartCardProps {
  chart: ChartData
  fileId?: number // Optional file ID for generating advanced insights
}

export function ChartCard({ chart, fileId }: ChartCardProps) {
  const [advancedInsight, setAdvancedInsight] = useState<string | null>(null)
  const [isLoadingInsight, setIsLoadingInsight] = useState(false)
  const [insightError, setInsightError] = useState<string | null>(null)

  const handleGenerateInsight = async () => {
    if (!fileId) {
      setInsightError('File ID not available')
      return
    }

    setIsLoadingInsight(true)
    setInsightError(null)

    try {
      const request: ChartInsightRequest = {
        file_id: fileId,
        chart_type: chart.chart_type,
        chart_title: chart.title,
        chart_data: chart.data,
        x_column: chart.x_column,
        y_column: chart.y_column,
        category_column: chart.category_column,
        value_column: chart.value_column,
      }

      const response = await api.generateChartInsight(request)
      setAdvancedInsight(response.insight)
    } catch (error) {
      console.error('Error generating insight:', error)
      setInsightError('Failed to generate advanced insight')
    } finally {
      setIsLoadingInsight(false)
    }
  }

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
      <CardHeader className="relative">
        <CardTitle className="text-lg pr-12">{chart.title}</CardTitle>

        {/* Advanced Insight Icon - Top Right */}
        {fileId && (
          <div className="absolute top-4 right-4">
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleGenerateInsight}
                    disabled={isLoadingInsight}
                  >
                    {isLoadingInsight ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Lightbulb className="h-4 w-4 text-yellow-600 hover:text-yellow-700" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-md">
                  <p className="font-semibold">Get Advanced AI Insights</p>
                  <p className="text-xs text-muted-foreground">
                    Click for detailed analysis with statistics, anomalies, and recommendations
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <ReactECharts
          option={getChartOption()}
          style={{ height: '400px', width: '100%' }}
          opts={{ renderer: 'canvas' }}
        />

        {/* Basic insight (from analysis) */}
        {chart.insight && (
          <div className="pt-4 border-t">
            <div className="text-sm text-muted-foreground italic">
              <span className="font-semibold text-foreground">AI Insight: </span>
              <div className="inline prose prose-sm prose-slate max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <span>{children}</span>,
                    strong: ({ children }) => <strong className="text-foreground font-semibold">{children}</strong>,
                  }}
                >
                  {chart.insight}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {/* Advanced insight (on-demand) */}
        {advancedInsight && (
          <div className="pt-4 border-t border-yellow-200 bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-semibold text-sm text-yellow-900">
                  Advanced AI Analysis
                </p>
                <div className="text-sm prose prose-sm prose-yellow max-w-none [&>*]:text-yellow-800">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="text-yellow-800 mb-2">{children}</p>,
                      strong: ({ children }) => <strong className="text-yellow-900 font-bold">{children}</strong>,
                      ol: ({ children }) => <ol className="list-decimal ml-4 space-y-1 text-yellow-800">{children}</ol>,
                      ul: ({ children }) => <ul className="list-disc ml-4 space-y-1 text-yellow-800">{children}</ul>,
                      li: ({ children }) => <li className="text-yellow-800">{children}</li>,
                    }}
                  >
                    {advancedInsight}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {insightError && (
          <div className="pt-4 border-t border-red-200 bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-red-800">
              <span className="font-semibold">Error: </span>
              {insightError}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
