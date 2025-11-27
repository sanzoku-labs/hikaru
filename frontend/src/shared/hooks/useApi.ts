import { useState, useEffect, useCallback } from 'react';

/**
 * Options for the useApi hook
 */
export interface UseApiOptions<T> {
  /** Callback fired on successful data fetch */
  onSuccess?: (data: T) => void;
  /** Callback fired on error */
  onError?: (error: Error) => void;
  /** Whether to execute the API call immediately on mount (default: true) */
  immediate?: boolean;
  /** Dependencies array for automatic refetch */
  deps?: unknown[];
}

/**
 * Return type for the useApi hook
 */
export interface UseApiReturn<T> {
  /** The fetched data, null if not yet loaded or on error */
  data: T | null;
  /** Loading state */
  loading: boolean;
  /** Error object if the request failed */
  error: Error | null;
  /** Function to manually trigger a refetch */
  refetch: () => Promise<T | null>;
  /** Function to manually set the data (useful for optimistic updates) */
  setData: (data: T | null) => void;
  /** Function to manually set the error */
  setError: (error: Error | null) => void;
}

/**
 * Custom hook for handling API calls with loading, error, and data state.
 * Eliminates the need for manual try-catch blocks and state management.
 *
 * @example
 * ```tsx
 * // Simple usage
 * const { data, loading, error } = useApi(() => api.listProjects());
 *
 * // With options
 * const { data, loading, error, refetch } = useApi(
 *   () => api.getProject(projectId),
 *   {
 *     immediate: true,
 *     onSuccess: (data) => console.log('Loaded!', data),
 *     onError: (err) => toast.error(err.message),
 *     deps: [projectId]
 *   }
 * );
 *
 * // Manual refetch
 * <Button onClick={() => refetch()}>Refresh</Button>
 * ```
 */
export function useApi<T>(
  apiMethod: () => Promise<T>,
  options: UseApiOptions<T> = {}
): UseApiReturn<T> {
  const { onSuccess, onError, immediate = true, deps = [] } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);

      const result = await apiMethod();

      setData(result);
      onSuccess?.(result);

      return result;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      onError?.(errorObj);
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiMethod, onSuccess, onError]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute, ...deps]);

  return {
    data,
    loading,
    error,
    refetch: execute,
    setData,
    setError,
  };
}
