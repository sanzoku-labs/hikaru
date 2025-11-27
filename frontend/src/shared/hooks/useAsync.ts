import { useState, useCallback } from 'react';

/**
 * State for async operations
 */
export interface AsyncState<T> {
  /** The data returned from the async operation */
  data: T | null;
  /** Loading state */
  loading: boolean;
  /** Error object if the operation failed */
  error: Error | null;
}

/**
 * Return type for the useAsync hook
 */
export interface UseAsyncReturn<T> {
  /** Current state of the async operation */
  state: AsyncState<T>;
  /** Function to execute the async operation */
  execute: (...args: unknown[]) => Promise<T | null>;
  /** Reset state to initial values */
  reset: () => void;
  /** Set data manually (for optimistic updates) */
  setData: (data: T | null) => void;
}

/**
 * Custom hook for handling async operations with loading, error, and data state.
 * Unlike useApi, this doesn't execute immediately - you control when to call execute().
 *
 * Perfect for form submissions, button clicks, or any user-triggered async actions.
 *
 * @example
 * ```tsx
 * // Form submission
 * const { state, execute } = useAsync(async (values) => {
 *   return await api.createProject(values);
 * });
 *
 * const handleSubmit = async (values) => {
 *   const result = await execute(values);
 *   if (result) {
 *     navigate('/projects');
 *   }
 * };
 *
 * return (
 *   <form onSubmit={handleSubmit}>
 *     {state.error && <Alert>{state.error.message}</Alert>}
 *     <Button disabled={state.loading}>
 *       {state.loading ? 'Saving...' : 'Save'}
 *     </Button>
 *   </form>
 * );
 * ```
 */
export function useAsync<T>(
  asyncFunction: (...args: unknown[]) => Promise<T>
): UseAsyncReturn<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: unknown[]): Promise<T | null> => {
      setState({ data: null, loading: true, error: null });

      try {
        const result = await asyncFunction(...args);
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setState({ data: null, loading: false, error: errorObj });
        return null;
      }
    },
    [asyncFunction]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  const setData = useCallback((data: T | null) => {
    setState((prev) => ({ ...prev, data }));
  }, []);

  return {
    state,
    execute,
    reset,
    setData,
  };
}
