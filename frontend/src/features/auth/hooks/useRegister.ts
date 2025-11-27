/**
 * Registration mutation hook
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import type { UserRegister } from '@/types';

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: UserRegister) => authApi.register(userData),

    onSuccess: () => {
      // Invalidate current user query to refetch with new token
      queryClient.invalidateQueries({ queryKey: ['auth', 'currentUser'] });
    },
  });
}
