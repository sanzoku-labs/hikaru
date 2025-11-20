// ===== Phase 8: Authentication Types =====

export interface UserRegister {
  email: string;
  username: string;
  password: string;
  full_name?: string;
}

export interface UserLogin {
  username: string; // Can be username or email
  password: string;
}

export interface UserResponse {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

// ===== Phase 1: Upload Types =====

export interface ColumnInfo {
  name: string;
  type: "numeric" | "categorical" | "datetime";
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
  data_schema: DataSchema;
  /** ISO 8601 datetime string */
  upload_timestamp: string;
}

export interface ErrorResponse {
  error: string;
  detail: string;
  code?: string;
}

// Phase 2: Chart Types
export interface ChartData {
  chart_type: "line" | "bar" | "pie" | "scatter";
  title: string;
  x_column?: string;
  y_column?: string;
  category_column?: string;
  value_column?: string;
  data: Array<Record<string, any>>;
  priority: number;
  insight?: string; // Phase 3: AI-generated insight
}

export interface AnalyzeResponse {
  upload_id: string;
  filename: string;
  data_schema: DataSchema;
  charts: ChartData[];
  upload_timestamp: string;
  global_summary?: string; // Phase 3: Overall AI summary
}

// Phase 4: Q&A Interface Types
export interface QueryRequest {
  upload_id: string;
  question: string;
  conversation_id?: string;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface QueryResponse {
  answer: string;
  conversation_id: string;
  timestamp: string;
  chart?: ChartData; // Phase 4B: Generated chart if requested
}

// Phase 5: PDF Export Types
export interface ExportRequest {
  upload_id: string;
}

export interface ExportResponse {
  export_id: string;
  download_url: string;
  filename: string;
  generated_at: string;
}

// Phase 5B: Advanced Export Types
export interface AdvancedExportRequest {
  project_id?: number;
  file_id?: number;
  upload_id?: string;
  export_format: "pdf" | "png" | "excel";
  include_charts: boolean;
  include_insights: boolean;
  include_raw_data: boolean;
  include_summary: boolean;
  custom_filename?: string;
  custom_title?: string;
  chart_ids?: number[];
}

export interface AdvancedExportResponse {
  export_id: string;
  download_url: string;
  filename: string;
  file_size?: number;
  export_format: string;
  generated_at: string;
  expires_at: string;
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
  data_schema_json?: string;
  uploaded_at: string;
  has_analysis: boolean;
  analyzed_at?: string;
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

export interface ProjectFileUploadResponse {
  file_id: number;
  upload_id: string;
  filename: string;
  file_size: number;
  row_count: number;
  data_schema: DataSchema;
  uploaded_at: string;
}

// Phase 7B: File Comparison
export interface ComparisonRequest {
  file_a_id: number;
  file_b_id: number;
  comparison_type?: "trend" | "yoy" | "side_by_side";
}

export interface OverlayChartData {
  chart_type: "line" | "bar" | "scatter";
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
  join_type?: "inner" | "left" | "right" | "outer";
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

// Phase 7D: File Analysis Types
export interface FileAnalyzeRequest {
  user_intent?: string;
}

export interface FileAnalysisResponse {
  file_id: number;
  filename: string;
  charts: ChartData[];
  global_summary?: string;
  user_intent?: string;
  analyzed_at: string;
}

export interface AnalysisHistoryItem {
  analysis_id: string;
  file_id: number;
  filename: string;
  charts_count: number;
  user_intent?: string;
  analyzed_at: string;
  has_global_summary: boolean;
}

export interface AnalysisHistoryResponse {
  file_id: number;
  filename: string;
  total_analyses: number;
  analyses: AnalysisHistoryItem[];
}

// Multi-Analysis Types (FileAnalysis table)
export interface SavedAnalysisSummary {
  analysis_id: number;
  user_intent?: string;
  charts_count: number;
  created_at: string;
}

export interface SavedAnalysisDetail {
  analysis_id: number;
  file_id: number;
  filename: string;
  charts: ChartData[];
  global_summary?: string;
  user_intent?: string;
  created_at: string;
}

export interface AnalysisListResponse {
  file_id: number;
  filename: string;
  total_analyses: number;
  analyses: SavedAnalysisSummary[];
}

// Dashboard Types
export interface DashboardCreate {
  name: string;
  dashboard_type: "single_file" | "comparison" | "merged";
  config_json: string;
}

export interface DashboardUpdate {
  name?: string;
  config_json?: string;
  chart_data?: string;
}

export interface DashboardResponse {
  id: number;
  project_id: number;
  name: string;
  dashboard_type: string;
  config_json: string;
  chart_data?: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardListResponse {
  dashboards: DashboardResponse[];
  total: number;
}

// Analytics Types
export interface RecentAnalysis {
  analysis_id: number;
  file_id: number;
  filename: string;
  project_id: number;
  project_name: string;
  analyzed_at: string;
  charts_count: number;
  has_global_summary: boolean;
  user_intent?: string;
}

export interface ChartDistribution {
  line: number;
  bar: number;
  pie: number;
  scatter: number;
}

export interface TopInsight {
  file_id: number;
  filename: string;
  project_name: string;
  insight: string;
  analyzed_at: string;
}

export interface AnalyticsResponse {
  total_projects: number;
  total_files: number;
  total_analyses: number;
  projects_trend: number;
  files_trend: number;
  analyses_trend: number;
  recent_analyses: RecentAnalysis[];
  chart_type_distribution: ChartDistribution;
  top_insights: TopInsight[];
}

// ===== Phase 10: Advanced Chart Insights Types =====

export interface ChartInsightRequest {
  file_id: number;
  chart_type: "line" | "bar" | "pie" | "scatter";
  chart_title: string;
  chart_data: Array<Record<string, any>>;
  x_column?: string;
  y_column?: string;
  category_column?: string;
  value_column?: string;
}

export interface ChartInsightResponse {
  insight: string;
  insight_type: "basic" | "advanced";
  chart_hash: string;
  generated_at: string;
  model_version: string;
  cached: boolean;
}
