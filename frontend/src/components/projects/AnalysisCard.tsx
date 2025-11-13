/**
 * AnalysisCard - Saved analysis preview card (Mockup 3)
 *
 * Features:
 * - Analysis metadata
 * - Charts count indicator
 * - User intent display
 * - Load/Re-run actions
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Lightbulb, Eye, RefreshCw, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalysisCardProps {
  analysis: {
    analysis_id: string;
    file_id: number;
    filename: string;
    charts_count: number;
    user_intent?: string;
    analyzed_at: string;
    has_global_summary: boolean;
  };
  onLoad: () => void;
  onRerun?: () => void;
  className?: string;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export function AnalysisCard({
  analysis,
  onLoad,
  onRerun,
  className
}: AnalysisCardProps) {
  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{analysis.filename}</CardTitle>
            <CardDescription className="mt-1 flex items-center gap-1.5 text-xs">
              <Clock className="h-3 w-3" />
              {formatDate(analysis.analyzed_at)}
            </CardDescription>
          </div>
          <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Charts and Summary Indicators */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-xs">
            <BarChart3 className="h-3 w-3 mr-1" />
            {analysis.charts_count} {analysis.charts_count === 1 ? 'Chart' : 'Charts'}
          </Badge>
          {analysis.has_global_summary && (
            <Badge variant="secondary" className="text-xs">
              <Lightbulb className="h-3 w-3 mr-1" />
              AI Summary
            </Badge>
          )}
        </div>

        {/* User Intent */}
        {analysis.user_intent && (
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Analysis Focus:
            </p>
            <p className="text-sm italic line-clamp-2">
              "{analysis.user_intent}"
            </p>
          </div>
        )}

        {/* Quick Preview (placeholder for future enhancement) */}
        <div className="grid grid-cols-3 gap-1 pt-2">
          {[...Array(Math.min(3, analysis.charts_count))].map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded bg-muted/50 flex items-center justify-center"
            >
              <BarChart3 className="h-4 w-4 text-muted-foreground/50" />
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button
          variant="default"
          size="sm"
          className="flex-1"
          onClick={onLoad}
        >
          <Eye className="h-4 w-4 mr-2" />
          View Analysis
        </Button>
        {onRerun && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRerun}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
