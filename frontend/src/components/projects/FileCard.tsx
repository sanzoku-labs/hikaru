/**
 * FileCard - File display card with thumbnail and metadata
 *
 * Features:
 * - File type icon
 * - File metadata (size, rows, upload date)
 * - Analysis status badge
 * - Action buttons
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, FileSpreadsheet, BarChart3, Eye, Trash2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileCardProps {
  file: {
    id: number;
    filename: string;
    file_size: number;
    row_count?: number;
    uploaded_at: string;
    has_analysis: boolean;
    analyzed_at?: string;
  };
  onAnalyze?: () => void;
  onViewAnalysis?: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
  className?: string;
}

const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'csv') return FileText;
  if (ext === 'xlsx' || ext === 'xls') return FileSpreadsheet;
  return FileText;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export function FileCard({
  file,
  onAnalyze,
  onViewAnalysis,
  onDelete,
  onDownload,
  className
}: FileCardProps) {
  const FileIcon = getFileIcon(file.filename);

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
            <FileIcon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{file.filename}</CardTitle>
            <CardDescription className="mt-1">
              <div className="flex items-center gap-3 text-xs">
                <span>{formatFileSize(file.file_size)}</span>
                {file.row_count && (
                  <>
                    <span>•</span>
                    <span>{file.row_count.toLocaleString()} rows</span>
                  </>
                )}
                <span>•</span>
                <span>{formatDate(file.uploaded_at)}</span>
              </div>
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {file.has_analysis && file.analyzed_at ? (
          <Badge variant="secondary" className="text-xs">
            <BarChart3 className="h-3 w-3 mr-1" />
            Analyzed {formatDate(file.analyzed_at)}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs">
            Not analyzed
          </Badge>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 pt-3">
        {file.has_analysis ? (
          <>
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={onViewAnalysis}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Analysis
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onAnalyze}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={onAnalyze}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analyze
          </Button>
        )}

        {onDownload && (
          <Button variant="ghost" size="sm" onClick={onDownload}>
            <Download className="h-4 w-4" />
          </Button>
        )}

        {onDelete && (
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
