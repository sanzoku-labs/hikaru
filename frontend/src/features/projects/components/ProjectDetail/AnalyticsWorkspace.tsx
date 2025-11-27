/**
 * Analytics Workspace Component
 * Displays charts and global summary or prompts to analyze
 */

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3 } from 'lucide-react';
import { ChartGrid } from '@/components/ChartGrid';
import { GlobalSummary } from '@/components/GlobalSummary';
import type { ChartData } from '@/types';

interface AnalyticsWorkspaceProps {
  charts: ChartData[] | null;
  globalSummary: string | null;
  onAnalyze: () => void;
}

export function AnalyticsWorkspace({
  charts,
  globalSummary,
  onAnalyze,
}: AnalyticsWorkspaceProps) {
  if (charts && charts.length > 0) {
    return (
      <div className="space-y-6">
        {globalSummary && <GlobalSummary summary={globalSummary} />}
        <ChartGrid charts={charts} loading={false} />
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-2">No analytics available</p>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          Generate charts and AI insights for this file
        </p>
        <Button onClick={onAnalyze} size="lg">
          <BarChart3 className="h-5 w-5 mr-2" />
          Analyze File
        </Button>
      </CardContent>
    </Card>
  );
}
