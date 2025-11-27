/**
 * Comparison Workspace Component
 * Displays file comparison results or prompts to start comparison
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GitCompare } from 'lucide-react';
import { GlobalSummary } from '@/components/GlobalSummary';
import type { ComparisonResponse } from '@/types';

interface ComparisonWorkspaceProps {
  comparisonData: ComparisonResponse | null;
  onStartComparison: () => void;
}

export function ComparisonWorkspace({
  comparisonData,
  onStartComparison,
}: ComparisonWorkspaceProps) {
  if (comparisonData) {
    return (
      <div className="space-y-6">
        <GlobalSummary summary={comparisonData.summary_insight} />
        <div>
          <h3 className="text-lg font-semibold mb-4">Overlay Charts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {comparisonData.overlay_charts.map((chart, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-base">{chart.title}</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {chart.file_a_name}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {chart.file_b_name}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {chart.comparison_insight && (
                    <p className="text-sm text-muted-foreground">
                      {chart.comparison_insight}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <GitCompare className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-2">No comparison results yet</p>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          Start a comparison to see overlay charts and insights
        </p>
        <Button onClick={onStartComparison} size="lg">
          <GitCompare className="h-5 w-5 mr-2" />
          Start Comparison
        </Button>
      </CardContent>
    </Card>
  );
}
