/**
 * Current user query hook
 */

import { useQuery } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { getAuthToken } from '@/lib/api.client';

export function useCurrentUser() {
  return useQuery({
    queryKey: ['auth', 'currentUser'],
    queryFn: () => authApi.getCurrentUser(),

    // Only fetch if we have a token
    enabled: !!getAuthToken(),

    // Keep user data fresh for longer (10 minutes)
    staleTime: 10 * 60 * 1000,

    // Retry on failure (token might be invalid)
    retry: false,
  });
}
