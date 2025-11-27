/**
 * Single project query hook
 */

import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../api/projects.api';

export function useProject(projectId: number | undefined) {
  return useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => projectsApi.getProject(projectId!),

    // Only fetch if we have a valid project ID
    enabled: !!projectId && projectId > 0,

    // Project details don't change often, keep fresh for 5 minutes
    staleTime: 5 * 60 * 1000,
  });
}
