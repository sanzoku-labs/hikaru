import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'
import type { DashboardCreate, DashboardResponse } from '@/types/api'

export const useCreateDashboard = (projectId: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: DashboardCreate) => {
      const response = await apiClient.post<DashboardResponse>(
        ENDPOINTS.DASHBOARDS.LIST(projectId),
        data
      )
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'dashboards'] })
      toast.success(`Dashboard "${data.name}" saved`)
    },
    onError: () => {
      toast.error('Failed to save dashboard')
    },
  })
}
