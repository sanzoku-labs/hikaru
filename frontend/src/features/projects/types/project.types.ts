/**
 * Project Type Definitions
 */

import type { ChartData, DataSchema } from '@/types';

// Project Management
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
  row_count: number | null;
  data_schema: DataSchema | null;
  uploaded_at: string;
}

// File Comparison
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

// File Merging
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

// File Analysis
export interface FileAnalyzeRequest {
  user_intent?: string;
  sheet_name?: string;
}

export interface FileAnalysisResponse {
  file_id: number;
  filename: string;
  charts: ChartData[];
  global_summary?: string;
  user_intent?: string;
  analyzed_at: string;
  data_schema?: DataSchema;
}

// Multi-Sheet Excel Support
export interface SheetInfo {
  name: string;
  index: number;
  is_hidden: boolean;
  row_count: number;
  column_count: number;
  preview?: Array<Record<string, any>>;
  has_numeric?: boolean;
  error?: string;
}

// Analysis History
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

// Alias for backward compatibility
export type AnalysisHistoryResponse = AnalysisListResponse;

// Dashboard
export interface DashboardCreate {
  name: string;
  dashboard_type: 'single_file' | 'comparison' | 'merged';
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
