/**
 * Project Grid Component
 * Displays projects in grid or list view
 */

import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FolderOpen, FileText, Calendar, ArrowRight, MoreVertical, Search } from 'lucide-react';
import { formatDate } from '@/shared/utils/formatters';
import type { ProjectResponse } from '@/types';

interface ProjectGridProps {
  projects: ProjectResponse[];
  viewMode: 'grid' | 'list';
  searchTerm: string;
  onArchive: (projectId: number) => void;
  onDelete: (projectId: number) => void;
}

export const ProjectGrid = memo(function ProjectGrid({
  projects,
  viewMode,
  searchTerm,
  onArchive,
  onDelete,
}: ProjectGridProps) {
  const navigate = useNavigate();

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] text-center">
        <Search className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No projects found matching "{searchTerm}"</p>
      </div>
    );
  }

  return (
    <div
      className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}
    >
      {projects.map((project) => {
        const status = project.is_archived
          ? 'Archived'
          : (project.file_count || 0) > 0
            ? 'Active'
            : 'Empty';
        const statusColor =
          status === 'Active'
            ? 'bg-emerald-100 text-emerald-700'
            : status === 'Archived'
              ? 'bg-gray-100 text-gray-700'
              : 'bg-blue-100 text-blue-700';

        return (
          <Card
            key={project.id}
            data-testid="project-card"
            className="hover:shadow-card-hover transition-all cursor-pointer group"
            onClick={() => navigate(`/projects/${project.id}`)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
                    <FolderOpen className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate group-hover:text-primary transition-colors">
                      {project.name}
                    </CardTitle>
                    {project.description && (
                      <CardDescription className="line-clamp-1 text-xs mt-1">
                        {project.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge className={statusColor} variant="secondary">
                    {status}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/projects/${project.id}`);
                        }}
                      >
                        Open Project
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/projects/${project.id}`);
                        }}
                      >
                        Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onArchive(project.id);
                        }}
                        className="text-orange-600"
                      >
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(project.id);
                        }}
                        className="text-red-600"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  <span>{project.file_count || 0} files</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(project.updated_at)}</span>
                </div>
              </div>
              <div className="pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/projects/${project.id}`);
                  }}
                >
                  Open Project
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
});
