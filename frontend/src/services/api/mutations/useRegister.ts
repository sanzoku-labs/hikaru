import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/services/axios'
import { ENDPOINTS } from '@/services/endpoints'
import { useAuthStore } from '@/stores/authStore'
import type { UserRegister, TokenResponse } from '@/types/api'

export const useRegister = () => {
  const setAuth = useAuthStore((state) => state.setAuth)

  return useMutation({
    mutationFn: async (userData: UserRegister) => {
      const response = await apiClient.post<TokenResponse>(
        ENDPOINTS.AUTH.REGISTER,
        userData
      )
      return response.data
    },
    onSuccess: (data) => {
      setAuth(data.user, data.access_token)
    },
  })
}
