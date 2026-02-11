import { Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface GlobalSummaryViewProps {
  summary: string
}

export function GlobalSummaryView({ summary }: GlobalSummaryViewProps) {
  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-card to-accent/5 animate-in-up">
      {/* Decorative glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />

      <CardHeader className="relative pb-0">
        <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          AI Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <p className="text-foreground leading-relaxed">{summary}</p>
      </CardContent>
    </Card>
  )
}
