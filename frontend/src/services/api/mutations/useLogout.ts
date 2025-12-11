import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'
import { useAuthStore } from '@/stores/authStore'

export const useLogout = () => {
  const logout = useAuthStore((state) => state.logout)

  return useMutation({
    mutationFn: async () => {
      await apiClient.post(ENDPOINTS.AUTH.LOGOUT)
    },
    onSuccess: () => {
      logout()
    },
    onError: () => {
      // Logout anyway even if backend call fails
      logout()
    },
  })
}
