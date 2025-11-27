/**
 * Unified API Module - Backward Compatible
 * This module maintains the old `api` object structure while using the new modular APIs
 */

import { authApi } from '@/features/auth/api/auth.api';
import { projectsApi } from '@/features/projects/api/projects.api';
import { filesApi } from '@/features/projects/api/files.api';
import { analyticsApi } from '@/features/analytics/api/analytics.api';

// Re-export the ApiError for backward compatibility
export { ApiError } from '@/lib/api.client';

/**
 * Unified API object that combines all API modules
 * Maintains backward compatibility with existing code
 */
export const api = {
  // ===== Authentication =====
  register: authApi.register,
  login: authApi.login,
  getCurrentUser: authApi.getCurrentUser,
  logout: authApi.logout,

  // ===== Quick Upload/Analyze (non-project workflow) =====
  uploadFile: analyticsApi.uploadFile,
  analyzeData: analyticsApi.analyzeData,
  queryData: analyticsApi.queryData,
  exportDashboard: analyticsApi.exportDashboard,
  downloadPDF: analyticsApi.downloadPDF,
  exportAdvanced: analyticsApi.exportAdvanced,

  // ===== Projects =====
  createProject: projectsApi.createProject,
  listProjects: projectsApi.listProjects,
  getProject: projectsApi.getProject,
  updateProject: projectsApi.updateProject,
  deleteProject: projectsApi.deleteProject,

  // ===== Project Files =====
  uploadFileToProject: filesApi.uploadFileToProject,
  listProjectFiles: filesApi.listProjectFiles,
  deleteProjectFile: filesApi.deleteProjectFile,
  downloadProjectFile: filesApi.downloadProjectFile,
  getFileSheets: filesApi.getFileSheets,
  analyzeProjectFile: filesApi.analyzeProjectFile,
  getProjectFileAnalysis: filesApi.getProjectFileAnalysis,
  getAnalysisHistory: filesApi.getAnalysisHistory,

  // ===== File Comparison =====
  compareFiles: filesApi.compareFiles,

  // ===== File Merging =====
  createRelationship: filesApi.createRelationship,
  listRelationships: filesApi.listRelationships,
  deleteRelationship: filesApi.deleteRelationship,
  analyzeMergedData: filesApi.analyzeMergedData,

  // ===== Multi-Analysis =====
  listFileAnalyses: filesApi.listFileAnalyses,
  getFileAnalysis: filesApi.getFileAnalysis,
  deleteFileAnalysis: filesApi.deleteFileAnalysis,

  // ===== Analytics =====
  getAnalytics: analyticsApi.getAnalytics,

  // ===== Dashboards =====
  createDashboard: analyticsApi.createDashboard,
  listDashboards: analyticsApi.listDashboards,
  getDashboard: analyticsApi.getDashboard,
  updateDashboard: analyticsApi.updateDashboard,
  deleteDashboard: analyticsApi.deleteDashboard,

  // ===== Chart Insights =====
  generateChartInsight: analyticsApi.generateChartInsight,
};

export default api;

// Also export individual API modules for new code
export { authApi } from '@/features/auth/api/auth.api';
export { projectsApi } from '@/features/projects/api/projects.api';
export { filesApi } from '@/features/projects/api/files.api';
export { analyticsApi } from '@/features/analytics/api/analytics.api';
