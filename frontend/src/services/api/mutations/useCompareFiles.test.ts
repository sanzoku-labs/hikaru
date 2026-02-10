import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useCompareFiles } from './useCompareFiles'
import { createQueryWrapper } from '@/test/queryWrapper'

vi.mock('@/services/axios', () => ({
  apiClient: {
    post: vi.fn(),
  },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { apiClient } from '@/services/axios'
import { toast } from 'sonner'

const mockedPost = vi.mocked(apiClient.post)

describe('useCompareFiles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls compare endpoint with project ID and data', async () => {
    const compareResult = { overlay_charts: [{ title: 'Chart 1' }] }
    mockedPost.mockResolvedValue({ data: compareResult })

    const { result } = renderHook(() => useCompareFiles(5), { wrapper: createQueryWrapper() })

    await act(async () => {
      await result.current.mutateAsync({
        file_a_id: 1,
        file_b_id: 2,
        comparison_type: 'side_by_side',
      })
    })

    expect(mockedPost).toHaveBeenCalledWith('/api/projects/5/compare', {
      file_a_id: 1,
      file_b_id: 2,
      comparison_type: 'side_by_side',
    })
  })

  it('shows success toast with chart count', async () => {
    mockedPost.mockResolvedValue({ data: { overlay_charts: [1, 2, 3] } })

    const { result } = renderHook(() => useCompareFiles(1), { wrapper: createQueryWrapper() })

    await act(async () => {
      await result.current.mutateAsync({ file_a_id: 1, file_b_id: 2, comparison_type: 'trend' })
    })

    expect(toast.success).toHaveBeenCalledWith('Comparison complete: 3 charts')
  })

  it('shows error toast on failure', async () => {
    mockedPost.mockRejectedValue(new Error('Failed'))

    const { result } = renderHook(() => useCompareFiles(1), { wrapper: createQueryWrapper() })

    await act(async () => {
      try {
        await result.current.mutateAsync({ file_a_id: 1, file_b_id: 2, comparison_type: 'trend' })
      } catch {
        // expected
      }
    })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to compare files')
    })
  })

  it('returns comparison result', async () => {
    const compareResult = { overlay_charts: [] }
    mockedPost.mockResolvedValue({ data: compareResult })

    const { result } = renderHook(() => useCompareFiles(1), { wrapper: createQueryWrapper() })

    let data: any
    await act(async () => {
      data = await result.current.mutateAsync({ file_a_id: 1, file_b_id: 2, comparison_type: 'yoy' })
    })

    expect(data).toEqual(compareResult)
  })
})
