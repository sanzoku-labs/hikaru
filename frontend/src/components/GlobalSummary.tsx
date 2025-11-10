import { Alert, AlertDescription } from '@/components/ui/alert'
import { Lightbulb } from 'lucide-react'

interface GlobalSummaryProps {
  summary: string
}

export function GlobalSummary({ summary }: GlobalSummaryProps) {
  return (
    <Alert className="bg-primary/5 border-primary/20">
      <Lightbulb className="h-5 w-5 text-primary" />
      <AlertDescription className="ml-2">
        <span className="font-semibold text-foreground">Key Insights: </span>
        <span className="text-muted-foreground">{summary}</span>
      </AlertDescription>
    </Alert>
  )
}
