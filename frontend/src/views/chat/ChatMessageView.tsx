import { cn } from '@/lib/utils'
import { User, Sparkles } from 'lucide-react'
import { ChartCardView } from '@/views/charts/ChartCardView'
import { LineChartView } from '@/views/charts/LineChartView'
import { BarChartView } from '@/views/charts/BarChartView'
import { PieChartView } from '@/views/charts/PieChartView'
import { ScatterChartView } from '@/views/charts/ScatterChartView'
import type { ChatMessage, ChartData } from '@/types/api'

interface ChatMessageViewProps {
  message: ChatMessage
  className?: string
}

export function ChatMessageView({ message, className }: ChatMessageViewProps) {
  const isUser = message.role === 'user'

  const renderChart = (chart: ChartData) => {
    switch (chart.chart_type) {
      case 'line':
        return <LineChartView chartData={chart} />
      case 'bar':
        return <BarChartView chartData={chart} />
      case 'pie':
        return <PieChartView chartData={chart} />
      case 'scatter':
        return <ScatterChartView chartData={chart} />
      default:
        return null
    }
  }

  return (
    <div
      className={cn(
        'flex gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row',
        className
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
      </div>

      {/* Message content */}
      <div
        className={cn(
          'flex flex-col gap-2 max-w-[85%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        {/* Text bubble */}
        <div
          className={cn(
            'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
            isUser
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-muted text-foreground rounded-bl-md'
          )}
        >
          {message.content}
        </div>

        {/* Chart (if present in AI response) */}
        {message.chart && !isUser && (
          <div className="w-full max-w-sm">
            <ChartCardView title={message.chart.title} insight={message.chart.insight}>
              {renderChart(message.chart)}
            </ChartCardView>
          </div>
        )}

        {/* Timestamp */}
        <span className="text-xs text-muted-foreground/60 px-1">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  )
}
