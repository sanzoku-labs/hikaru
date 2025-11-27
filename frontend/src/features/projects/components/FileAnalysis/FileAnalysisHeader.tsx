/**
 * File Analysis Header Component
 * Displays file name, breadcrumbs, and action buttons
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Share2, Save } from 'lucide-react';
import type { FileInProject } from '@/types';

interface FileAnalysisHeaderProps {
  fileMetadata: FileInProject | null;
  isSaved: boolean;
  analyzing: boolean;
  onBack: () => void;
  onSave?: () => void;
  onExport: () => void;
}

export function FileAnalysisHeader({
  fileMetadata,
  isSaved,
  analyzing,
  onBack,
  onSave,
  onExport,
}: FileAnalysisHeaderProps) {
  return (
    <div className="mb-6">
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Project
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {fileMetadata?.filename || 'File Analysis'}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            {isSaved ? (
              <Badge variant="secondary">Saved Analysis</Badge>
            ) : (
              <Badge variant="outline">Temporary Analysis</Badge>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {!isSaved && onSave && (
            <Button
              onClick={onSave}
              disabled={analyzing}
              variant="outline"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Analysis
            </Button>
          )}

          <Button onClick={onExport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>

          <Button variant="outline">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
}
