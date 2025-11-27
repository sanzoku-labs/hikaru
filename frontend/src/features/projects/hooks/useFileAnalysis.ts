/**
 * File analysis query hook
 */

import { useQuery } from '@tanstack/react-query';
import { filesApi } from '../api/files.api';

export function useFileAnalysis(projectId: number | undefined, fileId: number | undefined) {
  return useQuery({
    queryKey: ['projects', projectId, 'files', fileId, 'analysis'],
    queryFn: () => filesApi.getProjectFileAnalysis(projectId!, fileId!),

    // Only fetch if we have valid IDs
    enabled: !!projectId && projectId > 0 && !!fileId && fileId > 0,

    // Analysis is expensive, keep cached for 10 minutes
    staleTime: 10 * 60 * 1000,

    // Retry once on failure
    retry: 1,
  });
}
