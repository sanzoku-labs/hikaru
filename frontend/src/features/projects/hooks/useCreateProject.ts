/**
 * Create project mutation hook
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../api/projects.api';
import type { ProjectCreate } from '@/types';

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProjectCreate) => projectsApi.createProject(data),

    onSuccess: () => {
      // Invalidate projects list to refetch with new project
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
