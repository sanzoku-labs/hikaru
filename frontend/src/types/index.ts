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

// Phase 4: Q&A Interface Types
export interface QueryRequest {
  upload_id: string;
  question: string;
  conversation_id?: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface QueryResponse {
  answer: string;
  conversation_id: string;
  timestamp: string;
  chart?: ChartData;  // Phase 4B: Generated chart if requested
}

// Phase 5: PDF Export Types
export interface ExportRequest {
  upload_id: string;
  format: 'pdf';  // Only PDF for MVP
  include_charts: boolean;
  include_insights: boolean;
}

export interface ExportResponse {
  export_id: string;
  status: 'processing' | 'completed' | 'failed';
  download_url?: string;
  filename?: string;
  created_at: string;
  error_message?: string;
}
