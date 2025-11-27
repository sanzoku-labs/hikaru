/**
 * Preview Workspace Component
 * Displays data preview or prompts to analyze file
 */

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, BarChart3 } from 'lucide-react';
import { DataPreview } from '@/components/DataPreview';
import type { DataSchema } from '@/types';

interface PreviewWorkspaceProps {
  dataSchema: DataSchema | null;
  filename: string;
  onAnalyze: () => void;
}

export function PreviewWorkspace({
  dataSchema,
  filename,
  onAnalyze,
}: PreviewWorkspaceProps) {
  if (dataSchema) {
    return <DataPreview schema={dataSchema} filename={filename} />;
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <FileText className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-2">No analysis available</p>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          Analyze this file to see data preview and insights
        </p>
        <Button onClick={onAnalyze} size="lg">
          <BarChart3 className="h-5 w-5 mr-2" />
          Analyze File
        </Button>
      </CardContent>
    </Card>
  );
}
