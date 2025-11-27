/**
 * Project Files API module
 * Handles file operations within projects (upload, download, delete, analyze)
 */

import { apiClient } from '@/lib/api.client';
import type {
  ProjectFileUploadResponse,
  FileInProject,
  ComparisonRequest,
  ComparisonResponse,
  RelationshipCreate,
  RelationshipResponse,
  MergeAnalyzeRequest,
  MergeAnalyzeResponse,
  FileAnalysisResponse,
  AnalysisHistoryResponse,
  AnalysisListResponse,
  SavedAnalysisDetail,
  SheetInfo,
} from '@/types';

export const filesApi = {
  /**
   * Upload a file to a project
   */
  async uploadFileToProject(
    projectId: number,
    file: File,
  ): Promise<ProjectFileUploadResponse> {
    return apiClient.uploadFile<ProjectFileUploadResponse>(
      `/api/projects/${projectId}/files`,
      file
    );
  },

  /**
   * List all files in a project
   */
  async listProjectFiles(projectId: number): Promise<FileInProject[]> {
    return apiClient.get<FileInProject[]>(`/api/projects/${projectId}/files`);
  },

  /**
   * Delete a file from a project
   */
  async deleteProjectFile(projectId: number, fileId: number): Promise<void> {
    return apiClient.delete<void>(`/api/projects/${projectId}/files/${fileId}`);
  },

  /**
   * Download a file from a project
   * Automatically triggers browser download
   */
  async downloadProjectFile(projectId: number, fileId: number): Promise<void> {
    const blob = await apiClient.downloadFile(
      `/api/projects/${projectId}/files/${fileId}/download`
    );

    // Get filename from Content-Disposition header or use default
    // Note: apiClient.downloadFile doesn't expose headers yet, so we'll use a default
    const filename = `file_${fileId}.csv`;

    // Trigger browser download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  /**
   * Get sheets from an Excel file
   */
  async getFileSheets(
    projectId: number,
    fileId: number,
    preview: boolean = true,
  ): Promise<SheetInfo[]> {
    return apiClient.get<SheetInfo[]>(
      `/api/projects/${projectId}/files/${fileId}/sheets?preview=${preview}`
    );
  },

  /**
   * Analyze a file (generate charts and insights)
   */
  async analyzeProjectFile(
    projectId: number,
    fileId: number,
    userIntent?: string,
    sheetName?: string,
    save: boolean = true,
  ): Promise<FileAnalysisResponse> {
    return apiClient.post<FileAnalysisResponse>(
      `/api/projects/${projectId}/files/${fileId}/analyze?save=${save}`,
      {
        user_intent: userIntent,
        sheet_name: sheetName,
      }
    );
  },

  /**
   * Get the latest analysis for a file
   */
  async getProjectFileAnalysis(
    projectId: number,
    fileId: number,
  ): Promise<FileAnalysisResponse> {
    return apiClient.get<FileAnalysisResponse>(
      `/api/projects/${projectId}/files/${fileId}/analysis`
    );
  },

  /**
   * Get analysis history for a file
   */
  async getAnalysisHistory(
    projectId: number,
    fileId: number,
  ): Promise<AnalysisHistoryResponse> {
    return apiClient.get<AnalysisHistoryResponse>(
      `/api/projects/${projectId}/files/${fileId}/analysis-history`
    );
  },

  /**
   * Compare two files
   */
  async compareFiles(
    projectId: number,
    data: ComparisonRequest,
  ): Promise<ComparisonResponse> {
    return apiClient.post<ComparisonResponse>(
      `/api/projects/${projectId}/compare`,
      data
    );
  },

  /**
   * Create a relationship between two files for merging
   */
  async createRelationship(
    projectId: number,
    data: RelationshipCreate,
  ): Promise<RelationshipResponse> {
    return apiClient.post<RelationshipResponse>(
      `/api/projects/${projectId}/relationships`,
      data
    );
  },

  /**
   * List all relationships in a project
   */
  async listRelationships(projectId: number): Promise<RelationshipResponse[]> {
    return apiClient.get<RelationshipResponse[]>(
      `/api/projects/${projectId}/relationships`
    );
  },

  /**
   * Delete a relationship
   */
  async deleteRelationship(
    projectId: number,
    relationshipId: number,
  ): Promise<void> {
    return apiClient.delete<void>(
      `/api/projects/${projectId}/relationships/${relationshipId}`
    );
  },

  /**
   * Analyze merged data from two files
   */
  async analyzeMergedData(
    projectId: number,
    data: MergeAnalyzeRequest,
  ): Promise<MergeAnalyzeResponse> {
    return apiClient.post<MergeAnalyzeResponse>(
      `/api/projects/${projectId}/merge-analyze`,
      data
    );
  },

  // ===== Multi-Analysis Endpoints =====

  /**
   * List all saved analyses for a file
   */
  async listFileAnalyses(
    projectId: number,
    fileId: number,
  ): Promise<AnalysisListResponse> {
    return apiClient.get<AnalysisListResponse>(
      `/api/projects/${projectId}/files/${fileId}/analyses`
    );
  },

  /**
   * Get a specific saved analysis
   */
  async getFileAnalysis(
    projectId: number,
    fileId: number,
    analysisId: number,
  ): Promise<SavedAnalysisDetail> {
    return apiClient.get<SavedAnalysisDetail>(
      `/api/projects/${projectId}/files/${fileId}/analyses/${analysisId}`
    );
  },

  /**
   * Delete a saved analysis
   */
  async deleteFileAnalysis(
    projectId: number,
    fileId: number,
    analysisId: number,
  ): Promise<void> {
    return apiClient.delete<void>(
      `/api/projects/${projectId}/files/${fileId}/analyses/${analysisId}`
    );
  },
};
