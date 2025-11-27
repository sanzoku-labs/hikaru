/**
 * Project Header Component
 * Displays project name, description, stats, and action buttons
 */

import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Calendar, GitCompare, GitMerge } from 'lucide-react';
import { formatDate } from '@/shared/utils/formatters';
import type { ProjectResponse } from '@/types';

interface ProjectHeaderProps {
  project: ProjectResponse;
  fileCount: number;
  onBack: () => void;
  onCompare: () => void;
  onMerge: () => void;
}

export function ProjectHeader({
  project,
  fileCount,
  onBack,
  onCompare,
  onMerge,
}: ProjectHeaderProps) {
  return (
    <div>
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Projects
      </Button>
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
          {project.description && (
            <p className="text-muted-foreground">{project.description}</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              {fileCount} files
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Created {formatDate(project.created_at)}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCompare} disabled={fileCount < 2}>
            <GitCompare className="h-4 w-4 mr-2" />
            Compare
          </Button>
          <Button variant="outline" onClick={onMerge} disabled={fileCount < 2}>
            <GitMerge className="h-4 w-4 mr-2" />
            Merge
          </Button>
        </div>
      </div>
    </div>
  );
}
