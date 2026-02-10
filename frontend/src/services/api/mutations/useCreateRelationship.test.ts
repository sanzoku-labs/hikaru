import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useCreateRelationship } from './useCreateRelationship'
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

describe('useCreateRelationship', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls relationships endpoint with project ID', async () => {
    const result_data = { id: 1, file_a_id: 1, file_b_id: 2 }
    mockedPost.mockResolvedValue({ data: result_data })

    const { result } = renderHook(() => useCreateRelationship(5), { wrapper: createQueryWrapper() })

    await act(async () => {
      await result.current.mutateAsync({
        file_a_id: 1,
        file_b_id: 2,
        join_type: 'inner',
        left_key: 'id',
        right_key: 'product_id',
      })
    })

    expect(mockedPost).toHaveBeenCalledWith('/api/projects/5/relationships', {
      file_a_id: 1,
      file_b_id: 2,
      join_type: 'inner',
      left_key: 'id',
      right_key: 'product_id',
    })
  })

  it('shows success toast', async () => {
    mockedPost.mockResolvedValue({ data: { id: 1 } })

    const { result } = renderHook(() => useCreateRelationship(1), { wrapper: createQueryWrapper() })

    await act(async () => {
      await result.current.mutateAsync({
        file_a_id: 1, file_b_id: 2, join_type: 'left', left_key: 'a', right_key: 'b',
      })
    })

    expect(toast.success).toHaveBeenCalledWith('Merge relationship created')
  })

  it('shows error toast on failure', async () => {
    mockedPost.mockRejectedValue(new Error('Failed'))

    const { result } = renderHook(() => useCreateRelationship(1), { wrapper: createQueryWrapper() })

    await act(async () => {
      try {
        await result.current.mutateAsync({
          file_a_id: 1, file_b_id: 2, join_type: 'inner', left_key: 'a', right_key: 'b',
        })
      } catch {
        // expected
      }
    })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to create merge relationship')
    })
  })

  it('returns relationship data', async () => {
    const relationshipData = { id: 99 }
    mockedPost.mockResolvedValue({ data: relationshipData })

    const { result } = renderHook(() => useCreateRelationship(1), { wrapper: createQueryWrapper() })

    let data: any
    await act(async () => {
      data = await result.current.mutateAsync({
        file_a_id: 1, file_b_id: 2, join_type: 'inner', left_key: 'a', right_key: 'b',
      })
    })

    expect(data).toEqual(relationshipData)
  })
})
