/**
 * Login mutation hook
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import type { UserLogin } from '@/types';

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: UserLogin) => authApi.login(credentials),

    onSuccess: () => {
      // Invalidate current user query to refetch with new token
      queryClient.invalidateQueries({ queryKey: ['auth', 'currentUser'] });
    },
  });
}
