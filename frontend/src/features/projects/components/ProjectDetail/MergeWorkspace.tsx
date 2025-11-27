/**
 * Merge Workspace Component
 * Displays merge results or prompts to start merge
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GitMerge } from 'lucide-react';
import { ChartGrid } from '@/components/ChartGrid';
import { GlobalSummary } from '@/components/GlobalSummary';
import type { MergeAnalyzeResponse } from '@/types';

interface MergeWorkspaceProps {
  mergeResult: MergeAnalyzeResponse | null;
  onStartMerge: () => void;
}

export function MergeWorkspace({ mergeResult, onStartMerge }: MergeWorkspaceProps) {
  if (mergeResult) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Merged Data Summary</CardTitle>
            <CardDescription>
              {mergeResult.merged_row_count.toLocaleString()} rows in merged dataset
            </CardDescription>
          </CardHeader>
        </Card>

        {mergeResult.global_summary && (
          <GlobalSummary summary={mergeResult.global_summary} />
        )}

        <div>
          <h3 className="text-lg font-semibold mb-4">Analysis of Merged Data</h3>
          <ChartGrid charts={mergeResult.charts} loading={false} />
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <GitMerge className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-2">No merge results yet</p>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          Merge files to create enriched datasets for analysis
        </p>
        <Button onClick={onStartMerge} size="lg">
          <GitMerge className="h-5 w-5 mr-2" />
          Start Merge
        </Button>
      </CardContent>
    </Card>
  );
}
