/**
 * Project List Page - Refactored
 * Main page for listing and managing projects
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import type { ProjectResponse, ProjectCreate } from '@/types';
import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { FolderOpen } from 'lucide-react';
import { ProjectListHeader } from './ProjectListHeader';
import { ProjectStats } from './ProjectStats';
import { SearchAndFilters } from './SearchAndFilters';
import { ProjectGrid } from './ProjectGrid';
import {
  filterAndSortProjects,
  calculateProjectStats,
  type SortBy,
  type FilterBy,
} from '../../utils/projectFilters';

export default function ProjectListPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.listProjects(false);
      setProjects(response.projects);
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (projectData: ProjectCreate) => {
    const project = await api.createProject(projectData);
    setProjects([project, ...projects]);
    navigate(`/projects/${project.id}`);
  };

  const handleArchiveProject = async (projectId: number) => {
    try {
      await api.updateProject(projectId, { is_archived: true });
      setProjects(projects.map((p) => (p.id === projectId ? { ...p, is_archived: true } : p)));
    } catch (err: any) {
      setError(err.message || 'Failed to archive project');
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this project? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      await api.deleteProject(projectId);
      setProjects(projects.filter((p) => p.id !== projectId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete project');
    }
  };

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    return filterAndSortProjects(projects, searchTerm, sortBy, filterBy);
  }, [projects, searchTerm, sortBy, filterBy]);

  // Calculate statistics
  const stats = useMemo(() => {
    return calculateProjectStats(projects);
  }, [projects]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <ProjectListHeader onCreateProject={handleCreateProject} />

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-6 w-2/3 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : projects.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <FolderOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Projects Yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Create your first project to start uploading and analyzing multiple data files
              together
            </p>
            <ProjectListHeader onCreateProject={handleCreateProject} />
          </div>
        ) : (
          <>
            {/* Statistics Overview */}
            <ProjectStats stats={stats} />

            {/* Search and Filter Bar */}
            <SearchAndFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              sortBy={sortBy}
              onSortChange={setSortBy}
              filterBy={filterBy}
              onFilterChange={setFilterBy}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />

            {/* Projects List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {searchTerm ? 'Search Results' : 'All Projects'}
                </h2>
                <span className="text-sm text-muted-foreground">
                  {filteredAndSortedProjects.length}{' '}
                  {filteredAndSortedProjects.length === 1 ? 'project' : 'projects'}
                </span>
              </div>

              <ProjectGrid
                projects={filteredAndSortedProjects}
                viewMode={viewMode}
                searchTerm={searchTerm}
                onArchive={handleArchiveProject}
                onDelete={handleDeleteProject}
              />
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
