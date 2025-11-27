/**
 * Update project mutation hook
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../api/projects.api';
import type { ProjectUpdate } from '@/types';

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: number; data: ProjectUpdate }) =>
      projectsApi.updateProject(projectId, data),

    onSuccess: (_, variables) => {
      // Invalidate specific project and projects list
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
