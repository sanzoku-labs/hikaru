// ===== AUTHENTICATION TYPES =====
export interface UserRegister {
  email: string
  username: string
  password: string
  full_name?: string
}

export interface UserLogin {
  username: string // Can be username or email
  password: string
}

export interface UserResponse {
  id: number
  email: string
  username: string
  full_name: string | null
  is_active: boolean
  is_superuser: boolean
  created_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: 'bearer'
  user: UserResponse
}

// ===== DATA STRUCTURE TYPES =====
export interface ColumnInfo {
  name: string
  type: 'numeric' | 'categorical' | 'datetime'
  null_count: number
  unique_values?: number
  sample_values: (string | number | boolean | null)[]
  min?: number
  max?: number
  mean?: number
  median?: number
}

export interface DataSchema {
  columns: ColumnInfo[]
  row_count: number
  preview: Record<string, unknown>[]
}

export interface UploadResponse {
  upload_id: string
  filename: string
  data_schema: DataSchema
  upload_timestamp: string
}

// ===== CHART TYPES =====
export type ChartType = 'line' | 'bar' | 'pie' | 'scatter'

export interface ChartData {
  chart_type: ChartType
  title: string
  x_column?: string
  y_column?: string
  category_column?: string
  value_column?: string
  data: Record<string, any>[]
  priority: number
  insight?: string
  comparison_insight?: string
}

export interface AnalyzeResponse {
  upload_id: string
  filename: string
  data_schema: DataSchema
  charts: ChartData[]
  upload_timestamp: string
  global_summary?: string
}

// ===== ERROR TYPES =====
export interface ErrorResponse {
  error: string
  detail: string
  code?: string
}

// ===== PROJECT TYPES =====
export interface ProjectCreate {
  name: string
  description?: string
}

export interface ProjectUpdate {
  name?: string
  description?: string
}

export interface ProjectResponse {
  id: number
  name: string
  description: string | null
  user_id: number
  created_at: string
  updated_at: string
  file_count?: number
}

export interface ProjectFileResponse {
  id: number
  project_id: number
  filename: string
  file_size: number
  upload_id: string
  uploaded_at: string
  data_schema?: DataSchema
  has_analysis?: boolean
  analyzed_at?: string
}

export interface ProjectFileUploadResponse {
  file_id: number
  upload_id: string
  filename: string
  file_size: number
  row_count?: number
  data_schema?: DataSchema
  uploaded_at: string
}

export interface ProjectDetailResponse extends ProjectResponse {
  files: ProjectFileResponse[]
}

// ===== FILE COMPARISON TYPES =====
export interface ComparisonRequest {
  file_id_1: number
  file_id_2: number
}

export interface ComparisonStats {
  rows_added: number
  rows_removed: number
  rows_modified: number
  columns_added: string[]
  columns_removed: string[]
  common_columns: string[]
}

export interface ComparisonResponse {
  file_1: ProjectFileResponse
  file_2: ProjectFileResponse
  stats: ComparisonStats
  preview_diff: Record<string, any>[]
}

// ===== FILE MERGE TYPES =====
export interface MergeRequest {
  file_id_1: number
  file_id_2: number
  join_type: 'inner' | 'left' | 'right' | 'outer'
  join_keys: Record<string, string> // { file1_column: file2_column }
}

export interface MergeResponse {
  merged_filename: string
  data_schema: DataSchema
  charts: ChartData[]
  global_summary?: string
  row_count: number
}

// ===== EXCEL SHEET TYPES =====
export interface SheetInfo {
  sheet_name: string
  index: number
  row_count: number
  column_count: number
  has_numeric: boolean
  preview?: Record<string, any>[] // First 3 rows
}

// ===== FILE ANALYSIS TYPES =====
export interface FileAnalysisResponse {
  file_id: number
  filename?: string
  charts: ChartData[]
  global_summary?: string
  user_intent?: string
  sheet_name?: string
  analyzed_at: string // Backend uses analyzed_at, not created_at
  analysis_id?: number // Optional - may not be in response if not persisted
}

export interface FileAnalyzeRequest {
  user_intent?: string
  sheet_name?: string // For Excel files
}

// ===== COMPARISON TYPES (Updated) =====
export interface CompareFilesRequest {
  file_a_id: number
  file_b_id: number
  comparison_type: 'trend' | 'yoy' | 'side_by_side'
}

// Overlay chart data structure from backend
export interface OverlayChartData {
  chart_type: ChartType
  title: string
  file_a_name: string
  file_b_name: string
  x_column: string
  y_column: string
  file_a_data: Record<string, any>[]
  file_b_data: Record<string, any>[]
  comparison_insight?: string
}

export interface ComparisonResponse {
  comparison_id: number
  file_a: ProjectFileResponse // Backend uses FileInProject type
  file_b: ProjectFileResponse
  comparison_type: string
  overlay_charts: OverlayChartData[]
  summary_insight: string
  created_at: string
}

// ===== MERGE TYPES (Updated) =====
// IMPORTANT: Backend expects fields at root level, NOT nested in config!
export interface RelationshipCreate {
  file_a_id: number
  file_b_id: number
  join_type: 'inner' | 'left' | 'right' | 'outer' // Required, defaults to 'inner'
  left_key: string // Column name in file_a
  right_key: string // Column name in file_b
  left_suffix?: string // Defaults to '_a'
  right_suffix?: string // Defaults to '_b'
}

export interface RelationshipResponse {
  id: number
  project_id: number
  file_a_id: number
  file_b_id: number
  relationship_type: string
  config_json: string // Backend stores as JSON string
  created_at: string
}

export interface MergeAnalyzeRequest {
  relationship_id: number
}

export interface MergeAnalyzeResponse {
  relationship_id: number
  merged_row_count: number // Backend uses this instead of row_count_after
  merged_schema: DataSchema
  charts: ChartData[]
  global_summary?: string // Optional
}

// ===== DASHBOARD TYPES =====
export interface DashboardCreate {
  name: string
  dashboard_type: 'single_file' | 'comparison' | 'merged'
  config_json: string // JSON string with chart configs, file IDs, etc.
}

export interface DashboardUpdate {
  name?: string
  config_json?: string
  chart_data?: string
}

export interface DashboardResponse {
  id: number
  project_id: number
  name: string
  dashboard_type: string
  config_json: string
  chart_data: string | null
  created_at: string
  updated_at: string
}

export interface DashboardListResponse {
  dashboards: DashboardResponse[]
  total: number
}

// ===== ANALYTICS TYPES =====
export interface RecentAnalysis {
  file_id: number
  filename: string
  project_id: number
  project_name: string
  analyzed_at: string
  charts_count: number
}

export interface ChartDistribution {
  line: number
  bar: number
  pie: number
  scatter: number
}

export interface TopInsight {
  file_id: number
  filename: string
  project_name: string
  insight: string
  analyzed_at: string
}

export interface AnalyticsResponse {
  total_projects: number
  total_files: number
  total_analyses: number
  projects_trend: number // Percentage change from previous period
  files_trend: number
  analyses_trend: number
  recent_analyses: RecentAnalysis[]
  chart_type_distribution: ChartDistribution
  top_insights: TopInsight[]
}

// ===== CHART INSIGHT TYPES =====
export interface ChartInsightRequest {
  file_id: number
  chart_type: ChartType
  chart_title: string
  chart_data: Record<string, any>[]
  x_column?: string
  y_column?: string
  category_column?: string
  value_column?: string
}

export interface QuickChartInsightRequest {
  upload_id: string
  chart_type: ChartType
  chart_title: string
  chart_data: Record<string, any>[]
  x_column?: string
  y_column?: string
  category_column?: string
  value_column?: string
}

export interface ChartInsightResponse {
  insight: string
  insight_type: 'basic' | 'advanced'
  chart_hash: string
  generated_at: string
  model_version: string
  cached: boolean
}

// ===== LEGACY ANALYTICS TYPES (Deprecated) =====
export interface ProjectAnalytics {
  total_files: number
  total_analyses: number
  total_comparisons: number
  total_merges: number
  recent_activity: ActivityEvent[]
  chart_type_distribution: Record<ChartType, number>
  file_type_distribution: Record<string, number>
}

export interface ActivityEvent {
  type: 'analysis' | 'comparison' | 'merge' | 'upload'
  file_id: number
  filename: string
  timestamp: string
}

// ===== Q&A CHAT TYPES =====
export interface QueryRequest {
  upload_id: string
  question: string
  conversation_id?: string // For tracking conversation context
}

export interface QueryResponse {
  answer: string
  conversation_id: string
  timestamp: string
  chart?: ChartData // AI-generated chart if requested
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  chart?: ChartData // For assistant messages that include charts
}

// ===== HISTORY TYPES =====
export interface HistoryItem {
  analysis_id: number
  file_id: number
  filename: string
  project_id: number
  project_name: string
  charts_count: number
  user_intent: string | null
  first_insight: string | null
  created_at: string
}

export interface HistoryResponse {
  items: HistoryItem[]
  total: number
  page: number
  page_size: number
  has_more: boolean
}

export interface HistoryFilters {
  project_id?: number
  search?: string
  date_from?: string
  date_to?: string
  page?: number
  page_size?: number
}

// ===== AI ASSISTANT TYPES =====
export interface FileContext {
  file_id: number
  filename: string
  project_id: number
  project_name: string
}

export interface AssistantQueryRequest {
  file_ids: number[]
  question: string
  conversation_id?: string
}

export interface AssistantQueryResponse {
  answer: string
  conversation_id: string
  timestamp: string
  chart: ChartData | null
  files_used: FileContext[]
}

export interface ConversationSummary {
  conversation_id: string
  title: string | null
  file_context: FileContext[]
  message_count: number
  created_at: string
  updated_at: string
}

export interface ConversationListResponse {
  conversations: ConversationSummary[]
  total: number
}

export interface ConversationMessageDetail {
  id: number
  role: 'user' | 'assistant'
  content: string
  chart: ChartData | null
  created_at: string
}

export interface ConversationDetailResponse {
  conversation_id: string
  title: string | null
  file_context: FileContext[]
  messages: ConversationMessageDetail[]
  created_at: string
  updated_at: string
}

// ===== REPORTS TYPES =====
export interface ReportTemplate {
  id: string
  name: string
  description: string
  category: 'summary' | 'detailed' | 'comparison' | 'custom'
  sections: string[]
  estimated_pages: number
  icon: string
}

export interface ReportTemplateListResponse {
  templates: ReportTemplate[]
  total: number
}

export interface ReportGenerateRequest {
  template_id: string
  project_id?: number
  file_ids?: number[]
  title?: string
  include_raw_data?: boolean
  date_range_start?: string
  date_range_end?: string
}

export interface GeneratedReport {
  report_id: string
  template_id: string
  template_name: string
  title: string
  project_id: number | null
  file_count: number
  page_count: number
  file_size: number
  download_url: string
  preview_url: string | null
  created_at: string
  expires_at: string
}

export interface ReportGenerateResponse {
  report: GeneratedReport
  generation_time_ms: number
}

export interface ReportListResponse {
  reports: GeneratedReport[]
  total: number
}

// ===== INTEGRATIONS TYPES =====
export interface IntegrationProvider {
  id: string
  name: string
  description: string
  icon: string
  scopes: string[]
  is_available: boolean
}

export interface IntegrationProviderListResponse {
  providers: IntegrationProvider[]
  total: number
}

export interface IntegrationResponse {
  id: number
  provider: string
  provider_account_id: string | null
  provider_email: string | null
  is_active: boolean
  created_at: string
  last_used_at: string | null
}

export interface IntegrationListResponse {
  integrations: IntegrationResponse[]
  total: number
}

export interface OAuthInitiateResponse {
  auth_url: string
  state: string
}

export interface IntegrationCreate {
  provider: string
  code: string
  redirect_uri: string
}

export interface ProviderFile {
  id: string
  name: string
  mime_type: string | null
  size: number | null
  modified_at: string | null
  is_folder: boolean
  parent_id: string | null
  icon: string | null
  can_import: boolean
}

export interface ProviderFolder {
  id: string
  name: string
  path: string
}

export interface ProviderBrowseResponse {
  integration_id: number
  provider: string
  current_folder: ProviderFolder | null
  breadcrumbs: ProviderFolder[]
  files: ProviderFile[]
  folders: ProviderFile[]
  has_more: boolean
  next_page_token: string | null
}

export interface ImportFromProviderRequest {
  integration_id: number
  file_id: string
  target_project_id: number
}

export interface ImportFromProviderResponse {
  file_id: number
  filename: string
  project_id: number
  row_count: number | null
  data_schema: DataSchema | null
  import_source: string
  provider_file_id: string
}

// ===== API RESPONSE WRAPPER =====
export type ApiResponse<T> = {
  data: T
  status: number
  message?: string
}
