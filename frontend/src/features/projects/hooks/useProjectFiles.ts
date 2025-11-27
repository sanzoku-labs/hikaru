/**
 * Project files list query hook
 */

import { useQuery } from '@tanstack/react-query';
import { filesApi } from '../api/files.api';

export function useProjectFiles(projectId: number | undefined) {
  return useQuery({
    queryKey: ['projects', projectId, 'files'],
    queryFn: () => filesApi.listProjectFiles(projectId!),

    // Only fetch if we have a valid project ID
    enabled: !!projectId && projectId > 0,

    // Files list changes frequently, keep fresh for 2 minutes
    staleTime: 2 * 60 * 1000,
  });
}
