import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAnalytics } from './useAnalytics'
import { createQueryWrapper } from '@/test/queryWrapper'

vi.mock('@/services/axios', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

import { apiClient } from '@/services/axios'

const mockedGet = vi.mocked(apiClient.get)

describe('useAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches global analytics', async () => {
    const analyticsData = { total_projects: 5, total_files: 20, total_analyses: 15 }
    mockedGet.mockResolvedValue({ data: analyticsData })

    const { result } = renderHook(() => useAnalytics(), { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockedGet).toHaveBeenCalledWith('/api/analytics')
    expect(result.current.data).toEqual(analyticsData)
  })

  it('returns loading state initially', () => {
    mockedGet.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useAnalytics(), { wrapper: createQueryWrapper() })

    expect(result.current.isLoading).toBe(true)
  })

  it('handles errors', async () => {
    mockedGet.mockRejectedValue(new Error('Unauthorized'))

    const { result } = renderHook(() => useAnalytics(), { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })
})
