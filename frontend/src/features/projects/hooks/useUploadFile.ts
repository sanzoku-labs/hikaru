/**
 * Upload file mutation hook
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { filesApi } from '../api/files.api';

export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, file }: { projectId: number; file: File }) =>
      filesApi.uploadFileToProject(projectId, file),

    onSuccess: (_, variables) => {
      // Invalidate files list for this project
      queryClient.invalidateQueries({
        queryKey: ['projects', variables.projectId, 'files']
      });
    },
  });
}
