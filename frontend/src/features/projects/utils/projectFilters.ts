/**
 * Utilities for filtering and sorting projects
 */

import type { ProjectResponse } from '@/types';

export type SortBy = 'recent' | 'name' | 'files';
export type FilterBy = 'all' | 'active' | 'archived';

/**
 * Filter and sort projects based on criteria
 */
export function filterAndSortProjects(
  projects: ProjectResponse[],
  searchTerm: string,
  sortBy: SortBy,
  filterBy: FilterBy = 'all'
): ProjectResponse[] {
  let filtered = projects;

  // Apply search filter
  if (searchTerm) {
    filtered = filtered.filter(
      (project) =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Apply archive filter (optional future use)
  if (filterBy === 'active') {
    filtered = filtered.filter((p) => !p.is_archived);
  } else if (filterBy === 'archived') {
    filtered = filtered.filter((p) => p.is_archived);
  }

  // Apply sorting
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    } else if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'files') {
      return (b.file_count || 0) - (a.file_count || 0);
    }
    return 0;
  });

  return sorted;
}

/**
 * Calculate project statistics
 */
export interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  filesAnalyzed: number;
  reportsGenerated: number;
}

export function calculateProjectStats(projects: ProjectResponse[]): ProjectStats {
  const total = projects.length;
  const active = projects.filter((p) => !p.is_archived).length;
  const totalFiles = projects.reduce((sum, p) => sum + (p.file_count || 0), 0);

  return {
    totalProjects: total,
    activeProjects: active,
    filesAnalyzed: totalFiles,
    reportsGenerated: totalFiles * 2, // Mock: assume 2 reports per file
  };
}
