/**
 * Projects list query hook
 */

import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../api/projects.api';

export function useProjects(includeArchived = false) {
  return useQuery({
    queryKey: ['projects', includeArchived ? 'all' : 'active'],
    queryFn: () => projectsApi.listProjects(includeArchived),

    // Projects list changes frequently, keep fresh for 2 minutes
    staleTime: 2 * 60 * 1000,
  });
}
