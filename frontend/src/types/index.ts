/**
 * Core Type Definitions
 * Feature-specific types are exported from their respective feature folders
 */

// ===== Core Data Types =====

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

export interface ErrorResponse {
  error: string;
  detail: string;
  code?: string;
}

// ===== Upload Types =====

export interface UploadResponse {
  upload_id: string;
  filename: string;
  data_schema: DataSchema;
  upload_timestamp: string;
}

// ===== Chart Types =====

export interface ChartData {
  chart_type: 'line' | 'bar' | 'pie' | 'scatter';
  title: string;
  x_column?: string;
  y_column?: string;
  category_column?: string;
  value_column?: string;
  data: Array<Record<string, any>>;
  priority: number;
  insight?: string;
}

export interface AnalyzeResponse {
  upload_id: string;
  filename: string;
  data_schema: DataSchema;
  charts: ChartData[];
  upload_timestamp: string;
  global_summary?: string;
}

// ===== Q&A Types =====

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
  chart?: ChartData;
}

// ===== Export Types =====

export interface ExportRequest {
  upload_id: string;
}

export interface ExportResponse {
  export_id: string;
  download_url: string;
  filename: string;
  generated_at: string;
}

export interface AdvancedExportRequest {
  project_id?: number;
  file_id?: number;
  upload_id?: string;
  export_format: 'pdf' | 'png' | 'excel';
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

// ===== Chart Insights Types =====

export interface ChartInsightRequest {
  file_id: number;
  chart_type: 'line' | 'bar' | 'pie' | 'scatter';
  chart_title: string;
  chart_data: Array<Record<string, any>>;
  x_column?: string;
  y_column?: string;
  category_column?: string;
  value_column?: string;
}

export interface ChartInsightResponse {
  insight: string;
  insight_type: 'basic' | 'advanced';
  chart_hash: string;
  generated_at: string;
  model_version: string;
  cached: boolean;
}

// ===== Analytics Types =====

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

// ===== Re-export Feature Types =====

export type {
  UserRegister,
  UserLogin,
  UserResponse,
  TokenResponse,
} from '@/features/auth/types/auth.types';

export type {
  ProjectCreate,
  ProjectUpdate,
  FileInProject,
  ProjectResponse,
  ProjectListResponse,
  ProjectFileUploadResponse,
  ComparisonRequest,
  OverlayChartData,
  ComparisonResponse,
  RelationshipCreate,
  RelationshipResponse,
  MergeAnalyzeRequest,
  MergeAnalyzeResponse,
  FileAnalyzeRequest,
  FileAnalysisResponse,
  SheetInfo,
  SavedAnalysisSummary,
  SavedAnalysisDetail,
  AnalysisListResponse,
  AnalysisHistoryResponse,
  DashboardCreate,
  DashboardUpdate,
  DashboardResponse,
  DashboardListResponse,
} from '@/features/projects/types/project.types';
