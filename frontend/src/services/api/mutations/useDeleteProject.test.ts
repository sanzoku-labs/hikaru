import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useDeleteProject } from './useDeleteProject'
import { createQueryWrapper } from '@/test/queryWrapper'

vi.mock('@/services/axios', () => ({
  apiClient: {
    delete: vi.fn(),
  },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { apiClient } from '@/services/axios'
import { toast } from 'sonner'

const mockedDelete = vi.mocked(apiClient.delete)

describe('useDeleteProject', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls delete endpoint with project ID', async () => {
    mockedDelete.mockResolvedValue({})

    const { result } = renderHook(() => useDeleteProject(), { wrapper: createQueryWrapper() })

    await act(async () => {
      await result.current.mutateAsync(42)
    })

    expect(mockedDelete).toHaveBeenCalledWith('/api/projects/42')
  })

  it('shows success toast on deletion', async () => {
    mockedDelete.mockResolvedValue({})

    const { result } = renderHook(() => useDeleteProject(), { wrapper: createQueryWrapper() })

    await act(async () => {
      await result.current.mutateAsync(1)
    })

    expect(toast.success).toHaveBeenCalledWith('Project deleted')
  })

  it('shows error toast on failure', async () => {
    mockedDelete.mockRejectedValue(new Error('Failed'))

    const { result } = renderHook(() => useDeleteProject(), { wrapper: createQueryWrapper() })

    await act(async () => {
      try {
        await result.current.mutateAsync(1)
      } catch {
        // expected
      }
    })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to delete project')
    })
  })

  it('resolves to undefined on success', async () => {
    mockedDelete.mockResolvedValue({})

    const { result } = renderHook(() => useDeleteProject(), { wrapper: createQueryWrapper() })

    let data: any
    await act(async () => {
      data = await result.current.mutateAsync(1)
    })

    expect(data).toBeUndefined()
  })
})
