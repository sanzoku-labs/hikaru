import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
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
      queryClient.invalidateQueries({
        queryKey: ['projects', projectId, 'relationships'],
      })
      toast.success('Merge relationship created')
    },
    onError: () => {
      toast.error('Failed to create merge relationship')
    },
  })
}
