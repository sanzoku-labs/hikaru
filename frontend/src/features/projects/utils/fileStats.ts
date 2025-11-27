/**
 * File statistics calculation utilities
 */

import { formatFileSize, formatRelativeTime } from '@/shared/utils/formatters';
import type { FileInProject, DataSchema } from '@/types';

export interface FileStats {
  fileSize: string;
  rows: number;
  columns: number;
  dataQuality: number;
  missingValues: number;
  lastModified: string;
}

/**
 * Calculate file statistics from metadata
 */
export function calculateFileStats(fileMetadata: FileInProject | null): FileStats {
  if (!fileMetadata) {
    return {
      fileSize: 'N/A',
      rows: 0,
      columns: 0,
      dataQuality: 100,
      missingValues: 0,
      lastModified: 'N/A',
    };
  }

  let schema: DataSchema | null = null;
  try {
    schema = fileMetadata.data_schema_json
      ? JSON.parse(fileMetadata.data_schema_json)
      : null;
  } catch (e) {
    console.error('Failed to parse data_schema_json:', e);
  }

  const columnCount = schema?.columns?.length || 0;
  const rowCount = fileMetadata.row_count || schema?.row_count || 0;
  const totalCells = rowCount * columnCount;

  // Calculate missing values from schema
  const missingValues =
    schema?.columns?.reduce((sum, col) => sum + (col.null_count || 0), 0) || 0;

  // Calculate data quality percentage
  const dataQuality =
    totalCells > 0 ? ((totalCells - missingValues) / totalCells) * 100 : 100;

  // Format last modified date
  const lastModified = fileMetadata.analyzed_at || fileMetadata.uploaded_at;

  return {
    fileSize: formatFileSize(fileMetadata.file_size),
    rows: rowCount,
    columns: columnCount,
    dataQuality,
    missingValues,
    lastModified: formatRelativeTime(lastModified),
  };
}
