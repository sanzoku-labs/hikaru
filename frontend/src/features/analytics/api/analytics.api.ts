/**
 * Analytics API module
 * Handles analytics data, quick uploads, exports, dashboards, and chart insights
 */

import { apiClient } from '@/lib/api.client';
import type {
  UploadResponse,
  AnalyzeResponse,
  QueryRequest,
  QueryResponse,
  ExportRequest,
  ExportResponse,
  AdvancedExportRequest,
  AdvancedExportResponse,
  AnalyticsResponse,
  ChartInsightRequest,
  ChartInsightResponse,
  DashboardCreate,
  DashboardUpdate,
  DashboardResponse,
  DashboardListResponse,
} from '@/types';

export const analyticsApi = {
  // ===== Quick Upload/Analyze (original workflow) =====

  /**
   * Upload a file for quick analysis (non-project workflow)
   */
  async uploadFile(file: File): Promise<UploadResponse> {
    return apiClient.uploadFile<UploadResponse>('/api/upload', file);
  },

  /**
   * Analyze uploaded data
   */
  async analyzeData(
    uploadId: string,
    userIntent?: string,
  ): Promise<AnalyzeResponse> {
    const params = userIntent ? `?user_intent=${encodeURIComponent(userIntent)}` : '';
    return apiClient.get<AnalyzeResponse>(`/api/analyze/${uploadId}${params}`);
  },

  /**
   * Query data (Q&A chat)
   */
  async queryData(request: QueryRequest): Promise<QueryResponse> {
    return apiClient.post<QueryResponse>('/api/query', request);
  },

  /**
   * Export dashboard to PDF
   */
  async exportDashboard(request: ExportRequest): Promise<ExportResponse> {
    return apiClient.post<ExportResponse>('/api/export', request);
  },

  /**
   * Download PDF export
   */
  async downloadPDF(exportId: string): Promise<Blob> {
    return apiClient.downloadFile(`/api/download/${exportId}`);
  },

  /**
   * Advanced export with custom options
   */
  async exportAdvanced(
    request: AdvancedExportRequest,
  ): Promise<AdvancedExportResponse> {
    return apiClient.post<AdvancedExportResponse>('/api/export-advanced', request);
  },

  // ===== Analytics Dashboard =====

  /**
   * Get analytics overview
   */
  async getAnalytics(): Promise<AnalyticsResponse> {
    return apiClient.get<AnalyticsResponse>('/api/analytics');
  },

  // ===== Chart Insights =====

  /**
   * Generate AI insight for a specific chart
   */
  async generateChartInsight(
    request: ChartInsightRequest,
  ): Promise<ChartInsightResponse> {
    return apiClient.post<ChartInsightResponse>('/api/charts/insight', request);
  },

  // ===== Dashboards CRUD =====

  /**
   * Create a new dashboard in a project
   */
  async createDashboard(
    projectId: number,
    data: DashboardCreate,
  ): Promise<DashboardResponse> {
    return apiClient.post<DashboardResponse>(
      `/api/projects/${projectId}/dashboards`,
      data
    );
  },

  /**
   * List all dashboards in a project
   */
  async listDashboards(projectId: number): Promise<DashboardListResponse> {
    return apiClient.get<DashboardListResponse>(
      `/api/projects/${projectId}/dashboards`
    );
  },

  /**
   * Get a specific dashboard
   */
  async getDashboard(
    projectId: number,
    dashboardId: number,
  ): Promise<DashboardResponse> {
    return apiClient.get<DashboardResponse>(
      `/api/projects/${projectId}/dashboards/${dashboardId}`
    );
  },

  /**
   * Update a dashboard
   */
  async updateDashboard(
    projectId: number,
    dashboardId: number,
    data: DashboardUpdate,
  ): Promise<DashboardResponse> {
    return apiClient.put<DashboardResponse>(
      `/api/projects/${projectId}/dashboards/${dashboardId}`,
      data
    );
  },

  /**
   * Delete a dashboard
   */
  async deleteDashboard(projectId: number, dashboardId: number): Promise<void> {
    return apiClient.delete<void>(
      `/api/projects/${projectId}/dashboards/${dashboardId}`
    );
  },
};
