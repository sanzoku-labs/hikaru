import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useMergeAnalyze } from './useMergeAnalyze'
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

describe('useMergeAnalyze', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls merge-analyze endpoint with project ID', async () => {
    mockedPost.mockResolvedValue({ data: { merged_row_count: 100, charts: [] } })

    const { result } = renderHook(() => useMergeAnalyze(5), { wrapper: createQueryWrapper() })

    await act(async () => {
      await result.current.mutateAsync({ relationship_id: 10 })
    })

    expect(mockedPost).toHaveBeenCalledWith('/api/projects/5/merge-analyze', {
      relationship_id: 10,
    })
  })

  it('shows success toast with row count', async () => {
    mockedPost.mockResolvedValue({ data: { merged_row_count: 1500, charts: [] } })

    const { result } = renderHook(() => useMergeAnalyze(1), { wrapper: createQueryWrapper() })

    await act(async () => {
      await result.current.mutateAsync({ relationship_id: 1 })
    })

    expect(toast.success).toHaveBeenCalledWith('Merge complete: 1,500 rows')
  })

  it('shows error toast on failure', async () => {
    mockedPost.mockRejectedValue(new Error('Failed'))

    const { result } = renderHook(() => useMergeAnalyze(1), { wrapper: createQueryWrapper() })

    await act(async () => {
      try {
        await result.current.mutateAsync({ relationship_id: 1 })
      } catch {
        // expected
      }
    })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to merge files')
    })
  })

  it('returns merge result data', async () => {
    const mergeData = { merged_row_count: 200, charts: [{ title: 'Chart 1' }] }
    mockedPost.mockResolvedValue({ data: mergeData })

    const { result } = renderHook(() => useMergeAnalyze(1), { wrapper: createQueryWrapper() })

    let data: any
    await act(async () => {
      data = await result.current.mutateAsync({ relationship_id: 1 })
    })

    expect(data).toEqual(mergeData)
  })
})
