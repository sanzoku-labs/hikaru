import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useProjectDetail } from './useProjectDetail'
import { createQueryWrapper } from '@/test/queryWrapper'

vi.mock('@/services/axios', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

import { apiClient } from '@/services/axios'

const mockedGet = vi.mocked(apiClient.get)

describe('useProjectDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches project detail by ID', async () => {
    const projectDetail = { id: 5, name: 'My Project', files: [] }
    mockedGet.mockResolvedValue({ data: projectDetail })

    const { result } = renderHook(() => useProjectDetail(5), { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockedGet).toHaveBeenCalledWith('/api/projects/5')
    expect(result.current.data).toEqual(projectDetail)
  })

  it('is disabled when projectId is 0', () => {
    const { result } = renderHook(() => useProjectDetail(0), { wrapper: createQueryWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockedGet).not.toHaveBeenCalled()
  })

  it('returns loading state initially', () => {
    mockedGet.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useProjectDetail(1), { wrapper: createQueryWrapper() })

    expect(result.current.isLoading).toBe(true)
  })

  it('handles errors', async () => {
    mockedGet.mockRejectedValue(new Error('Not found'))

    const { result } = renderHook(() => useProjectDetail(999), { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })
})
