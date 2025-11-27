/**
 * File Stats Bar Component
 * Displays file statistics (size, rows, columns, quality)
 */

import { Card, CardContent } from '@/components/ui/card';
import type { FileInProject } from '@/types';
import { calculateFileStats } from '../../utils/fileStats';

interface FileStatsBarProps {
  fileMetadata: FileInProject | null;
}

export function FileStatsBar({ fileMetadata }: FileStatsBarProps) {
  const stats = calculateFileStats(fileMetadata);

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold">{stats.fileSize}</div>
          <p className="text-xs text-muted-foreground">File Size</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold">{stats.rows.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Rows</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold">{stats.columns}</div>
          <p className="text-xs text-muted-foreground">Columns</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold">{stats.dataQuality.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">Data Quality</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold">{stats.missingValues.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Missing Values</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold text-sm">{stats.lastModified}</div>
          <p className="text-xs text-muted-foreground">Last Modified</p>
        </CardContent>
      </Card>
    </div>
  );
}
