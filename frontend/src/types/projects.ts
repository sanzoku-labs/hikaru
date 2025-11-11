// Phase 7: Projects & Multi-File Workspaces TypeScript Types
// Corresponds to backend/app/models/schemas.py (Phase 7 schemas)

export interface Project {
  id: number;
  name: string;
  description: string | null;
  user_id: number;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  file_count?: number;
  files?: FileInProject[];
}

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
  row_count: number | null;
  schema_json: string | null;
  uploaded_at: string;
}

export interface ProjectListResponse {
  projects: Project[];
  total: number;
}

export interface ProjectFileUploadResponse {
  file_id: number;
  upload_id: string;
  filename: string;
  file_size: number;
  row_count: number;
  schema: any; // DataSchema from existing types
  uploaded_at: string;
}

// File Comparison Types
export type ComparisonType = "trend" | "yoy" | "side_by_side";

export interface ComparisonRequest {
  file_a_id: number;
  file_b_id: number;
  comparison_type: ComparisonType;
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
  comparison_insight: string | null;
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

// File Merging Types
export type JoinType = "inner" | "left" | "right" | "outer";

export interface RelationshipCreate {
  file_a_id: number;
  file_b_id: number;
  join_type: JoinType;
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
  merged_schema: any; // DataSchema
  charts: any[]; // ChartData[]
  global_summary: string | null;
}

// Dashboard Types
export type DashboardType = "single_file" | "comparison" | "merged";

export interface DashboardCreate {
  name: string;
  dashboard_type: DashboardType;
  config_json: string;
}

export interface DashboardResponse {
  id: number;
  project_id: number;
  name: string;
  dashboard_type: string;
  config_json: string;
  chart_data: string | null;
  created_at: string;
  updated_at: string;
}
