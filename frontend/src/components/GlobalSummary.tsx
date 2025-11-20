import { Alert, AlertDescription } from '@/components/ui/alert'
import { Lightbulb } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface GlobalSummaryProps {
  summary: string
}

export function GlobalSummary({ summary }: GlobalSummaryProps) {
  return (
    <Alert className="bg-primary/5 border-primary/20">
      <Lightbulb className="h-5 w-5 text-primary" />
      <AlertDescription className="ml-2">
        <span className="font-semibold text-foreground">Key Insights: </span>
        <div className="inline prose prose-sm prose-slate max-w-none text-muted-foreground">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <span>{children}</span>,
              strong: ({ children }) => <strong className="text-foreground font-semibold">{children}</strong>,
              ol: ({ children }) => <ol className="list-decimal ml-4 space-y-1 inline-block">{children}</ol>,
              ul: ({ children }) => <ul className="list-disc ml-4 space-y-1 inline-block">{children}</ul>,
              li: ({ children }) => <li className="text-muted-foreground">{children}</li>,
            }}
          >
            {summary}
          </ReactMarkdown>
        </div>
      </AlertDescription>
    </Alert>
  )
}
