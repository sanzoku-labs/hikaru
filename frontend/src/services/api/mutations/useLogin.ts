import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'
import { useAuthStore } from '@/stores/authStore'
import type { UserLogin, TokenResponse } from '@/types/api'

export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth)

  return useMutation({
    mutationFn: async (credentials: UserLogin) => {
      const response = await apiClient.post<TokenResponse>(
        ENDPOINTS.AUTH.LOGIN,
        credentials
      )
      return response.data
    },
    onSuccess: (data) => {
      setAuth(data.user, data.access_token)
    },
  })
}
