/**
 * Analyze file mutation hook
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { filesApi } from '../api/files.api';

interface AnalyzeFileParams {
  projectId: number;
  fileId: number;
  userIntent?: string;
  sheetName?: string;
  save?: boolean;
}

export function useAnalyzeFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, fileId, userIntent, sheetName, save = true }: AnalyzeFileParams) =>
      filesApi.analyzeProjectFile(projectId, fileId, userIntent, sheetName, save),

    onSuccess: (_, variables) => {
      // Invalidate analysis cache for this file
      queryClient.invalidateQueries({
        queryKey: ['projects', variables.projectId, 'files', variables.fileId, 'analysis']
      });

      // Also invalidate analyses list if we saved
      if (variables.save) {
        queryClient.invalidateQueries({
          queryKey: ['projects', variables.projectId, 'files', variables.fileId, 'analyses']
        });
      }
    },
  });
}
