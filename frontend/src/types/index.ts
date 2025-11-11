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

// ===== Phase 7: Projects & Multi-File Workspaces Types =====

// Phase 7A: Project Management
export interface ProjectCreate {
  name: string;
  description?: string;
}

export interface ProjectUpdate {
  name?: string;
  description?: string;
  is_archived?: boolean;
}

export interface FileInProject {
  id: number;
  project_id: number;
  filename: string;
  upload_id: string;
  file_size: number;
  row_count?: number;
  schema_json?: string;
  uploaded_at: string;
}

export interface ProjectResponse {
  id: number;
  name: string;
  description?: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  file_count?: number;
  files?: FileInProject[];
}

export interface ProjectListResponse {
  projects: ProjectResponse[];
  total: number;
}

// Phase 7B: File Comparison
export interface ComparisonRequest {
  file_a_id: number;
  file_b_id: number;
  comparison_type?: 'trend' | 'yoy' | 'side_by_side';
}

export interface OverlayChartData {
  chart_type: 'line' | 'bar' | 'scatter';
  title: string;
  file_a_name: string;
  file_b_name: string;
  x_column: string;
  y_column: string;
  file_a_data: Array<Record<string, any>>;
  file_b_data: Array<Record<string, any>>;
  comparison_insight?: string;
}

export interface ComparisonResponse {
  comparison_id: number;
  file_a: FileInProject;
  file_b: FileInProject;
  comparison_type: string;
  overlay_charts: OverlayChartData[];
  summary_insight: string;
  created_at: string;
}

// Phase 7C: File Merging
export interface RelationshipCreate {
  file_a_id: number;
  file_b_id: number;
  join_type?: 'inner' | 'left' | 'right' | 'outer';
  left_key: string;
  right_key: string;
  left_suffix?: string;
  right_suffix?: string;
}

export interface RelationshipResponse {
  id: number;
  project_id: number;
  file_a_id: number;
  file_b_id: number;
  relationship_type: string;
  config_json: string;
  created_at: string;
}

export interface MergeAnalyzeRequest {
  relationship_id: number;
}

export interface MergeAnalyzeResponse {
  relationship_id: number;
  merged_row_count: number;
  merged_schema: DataSchema;
  charts: ChartData[];
  global_summary?: string;
}
