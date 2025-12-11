import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'
import type { RelationshipCreate, RelationshipResponse } from '@/types/api'

export const useCreateRelationship = (projectId: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: RelationshipCreate) => {
      const { data: response } = await apiClient.post<RelationshipResponse>(
        ENDPOINTS.PROJECTS.RELATIONSHIPS(projectId),
        data
      )
      return response
    },
    onSuccess: () => {
      // Invalidate relationships query
      queryClient.invalidateQueries({
        queryKey: ['projects', projectId, 'relationships'],
      })
    },
  })
}
