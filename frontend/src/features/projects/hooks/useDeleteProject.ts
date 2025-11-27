/**
 * Delete project mutation hook
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../api/projects.api';

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: number) => projectsApi.deleteProject(projectId),

    onSuccess: (_, projectId) => {
      // Remove project from cache
      queryClient.removeQueries({ queryKey: ['projects', projectId] });

      // Invalidate projects list
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
