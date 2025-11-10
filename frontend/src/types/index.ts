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

// Phase 2: Chart Types
export interface ChartData {
  chart_type: 'line' | 'bar' | 'pie' | 'scatter';
  title: string;
  x_column?: string;
  y_column?: string;
  category_column?: string;
  value_column?: string;
  data: Array<Record<string, any>>;
  priority: number;
  insight?: string;  // Phase 3: AI-generated insight
}

export interface AnalyzeResponse {
  upload_id: string;
  filename: string;
  schema: DataSchema;
  charts: ChartData[];
  upload_timestamp: string;
  global_summary?: string;  // Phase 3: Overall AI summary
}
