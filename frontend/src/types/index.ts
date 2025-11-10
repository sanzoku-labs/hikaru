export interface ColumnInfo {
  name: string;
  type: 'numeric' | 'categorical' | 'datetime';
  null_count: number;
  unique_values?: number;
  sample_values: any[];
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
}

export interface DataSchema {
  columns: ColumnInfo[];
  row_count: number;
  preview: Record<string, any>[];
}

export interface UploadResponse {
  upload_id: string;
  filename: string;
  schema: DataSchema;
  upload_timestamp: string;
}

export interface ErrorResponse {
  error: string;
  detail: string;
  code?: string;
}
