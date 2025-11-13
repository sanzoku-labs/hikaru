/**
 * ExportModal - Advanced export options modal (Mockup 6)
 *
 * Features:
 * - Export format selection (PDF, PNG, Excel)
 * - Content selection (charts, insights, raw data)
 * - Custom filename
 * - Preview before export
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { FileDown, FileText, Image, FileSpreadsheet, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => Promise<void>;
  fileId?: number;
  projectId?: number;
  defaultFilename?: string;
}

export interface ExportOptions {
  format: 'pdf' | 'png' | 'excel';
  includeCharts: boolean;
  includeInsights: boolean;
  includeRawData: boolean;
  includeSummary: boolean;
  customFilename?: string;
  customTitle?: string;
}

const exportFormats = [
  {
    id: 'pdf',
    name: 'PDF Document',
    description: 'Best for reports and presentations',
    icon: FileText,
    disabled: false
  },
  {
    id: 'png',
    name: 'PNG Images',
    description: 'Individual chart images',
    icon: Image,
    disabled: true // Coming soon
  },
  {
    id: 'excel',
    name: 'Excel Spreadsheet',
    description: 'Data with embedded charts',
    icon: FileSpreadsheet,
    disabled: true // Coming soon
  }
];

export function ExportModal({
  open,
  onClose,
  onExport,
  fileId,
  projectId,
  defaultFilename = 'export'
}: ExportModalProps) {
  const [format, setFormat] = useState<'pdf' | 'png' | 'excel'>('pdf');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeInsights, setIncludeInsights] = useState(true);
  const [includeRawData, setIncludeRawData] = useState(false);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [customFilename, setCustomFilename] = useState(defaultFilename);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport({
        format,
        includeCharts,
        includeInsights,
        includeRawData,
        includeSummary,
        customFilename: customFilename || defaultFilename
      });
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Analysis</DialogTitle>
          <DialogDescription>
            Choose your export format and customize what to include
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Export Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <div className="grid grid-cols-3 gap-3">
              {exportFormats.map((fmt) => {
                const Icon = fmt.icon;
                return (
                  <button
                    key={fmt.id}
                    onClick={() => !fmt.disabled && setFormat(fmt.id as any)}
                    disabled={fmt.disabled}
                    className={cn(
                      'relative p-4 rounded-lg border-2 transition-all text-left',
                      'hover:border-primary hover:bg-accent/50',
                      format === fmt.id && 'border-primary bg-accent',
                      fmt.disabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div className="space-y-2">
                      <Icon className="h-6 w-6 text-primary" />
                      <div>
                        <p className="font-medium text-sm">{fmt.name}</p>
                        <p className="text-xs text-muted-foreground">{fmt.description}</p>
                      </div>
                    </div>
                    {fmt.disabled && (
                      <span className="absolute top-2 right-2 text-xs bg-muted px-2 py-0.5 rounded">
                        Soon
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Content Options */}
          <div className="space-y-3">
            <Label>Include in Export</Label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50">
                <input
                  type="checkbox"
                  checked={includeCharts}
                  onChange={(e) => setIncludeCharts(e.target.checked)}
                  className="h-4 w-4"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">Charts & Visualizations</p>
                  <p className="text-xs text-muted-foreground">All generated charts and graphs</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50">
                <input
                  type="checkbox"
                  checked={includeInsights}
                  onChange={(e) => setIncludeInsights(e.target.checked)}
                  className="h-4 w-4"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">AI Insights</p>
                  <p className="text-xs text-muted-foreground">Per-chart insights and observations</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50">
                <input
                  type="checkbox"
                  checked={includeSummary}
                  onChange={(e) => setIncludeSummary(e.target.checked)}
                  className="h-4 w-4"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">Global Summary</p>
                  <p className="text-xs text-muted-foreground">Overall analysis summary</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50">
                <input
                  type="checkbox"
                  checked={includeRawData}
                  onChange={(e) => setIncludeRawData(e.target.checked)}
                  className="h-4 w-4"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">Raw Data</p>
                  <p className="text-xs text-muted-foreground">Original dataset (increases file size)</p>
                </div>
              </label>
            </div>
          </div>

          <Separator />

          {/* Custom Filename */}
          <div className="space-y-2">
            <Label htmlFor="filename">Custom Filename (optional)</Label>
            <Input
              id="filename"
              value={customFilename}
              onChange={(e) => setCustomFilename(e.target.value)}
              placeholder="Enter filename..."
            />
            <p className="text-xs text-muted-foreground">
              Extension (.{format}) will be added automatically
            </p>
          </div>

          {/* Preview Summary */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <p className="text-sm font-medium">Export Preview</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Format:</span>
                <span className="font-medium uppercase">{format}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Charts:</span>
                <span className="font-medium">{includeCharts ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Insights:</span>
                <span className="font-medium">{includeInsights ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Raw Data:</span>
                <span className="font-medium">{includeRawData ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              'Exporting...'
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
