/**
 * Logout mutation hook
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),

    onSuccess: () => {
      // Clear all cached data on logout
      queryClient.clear();
    },
  });
}
