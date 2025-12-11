import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'
import type { SheetInfo } from '@/types/api'

export const useFileSheets = (
  projectId: number | undefined,
  fileId: number | undefined,
  preview = true
) => {
  return useQuery({
    queryKey: ['projects', projectId, 'files', fileId, 'sheets'],
    queryFn: async () => {
      if (!projectId || !fileId) throw new Error('Project ID and File ID are required')
      const { data } = await apiClient.get<SheetInfo[]>(
        ENDPOINTS.PROJECTS.FILE_SHEETS(projectId, fileId, preview)
      )
      return data
    },
    enabled: !!projectId && !!fileId,
    staleTime: 1000 * 60 * 10, // 10 minutes (sheets don't change)
  })
}
