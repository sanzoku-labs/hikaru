/**
 * Projects API module
 * Handles CRUD operations for projects
 */

import { apiClient } from '@/lib/api.client';
import type {
  ProjectCreate,
  ProjectUpdate,
  ProjectResponse,
  ProjectListResponse,
} from '@/types';

export const projectsApi = {
  /**
   * Create a new project
   */
  async createProject(data: ProjectCreate): Promise<ProjectResponse> {
    return apiClient.post<ProjectResponse>('/api/projects', data);
  },

  /**
   * List all projects for the current user
   */
  async listProjects(includeArchived = false): Promise<ProjectListResponse> {
    const params = includeArchived ? '?include_archived=true' : '';
    return apiClient.get<ProjectListResponse>(`/api/projects${params}`);
  },

  /**
   * Get a single project by ID
   */
  async getProject(projectId: number): Promise<ProjectResponse> {
    return apiClient.get<ProjectResponse>(`/api/projects/${projectId}`);
  },

  /**
   * Update a project
   */
  async updateProject(
    projectId: number,
    data: ProjectUpdate,
  ): Promise<ProjectResponse> {
    return apiClient.put<ProjectResponse>(`/api/projects/${projectId}`, data);
  },

  /**
   * Delete a project
   */
  async deleteProject(projectId: number): Promise<void> {
    return apiClient.delete<void>(`/api/projects/${projectId}`);
  },
};
