import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'
import type { FileAnalysisResponse } from '@/types/api'

export const useFileAnalysis = (
  projectId: number | undefined,
  fileId: number | undefined
) => {
  return useQuery({
    queryKey: ['projects', projectId, 'files', fileId, 'analysis'],
    queryFn: async () => {
      if (!projectId || !fileId) throw new Error('Project ID and File ID are required')
      const { data } = await apiClient.get<FileAnalysisResponse>(
        ENDPOINTS.PROJECTS.FILE_ANALYSIS(projectId, fileId)
      )
      return data
    },
    enabled: !!projectId && !!fileId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}
