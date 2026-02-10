import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useHistory } from './useHistory'
import { createQueryWrapper } from '@/test/queryWrapper'

vi.mock('@/services/axios', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

import { apiClient } from '@/services/axios'

const mockedGet = vi.mocked(apiClient.get)

describe('useHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches history without filters', async () => {
    const historyData = { items: [], total: 0, has_more: false }
    mockedGet.mockResolvedValue({ data: historyData })

    const { result } = renderHook(() => useHistory(), { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockedGet).toHaveBeenCalledWith('/api/history')
    expect(result.current.data).toEqual(historyData)
  })

  it('appends filters as query params', async () => {
    mockedGet.mockResolvedValue({ data: { items: [], total: 0, has_more: false } })

    const filters = {
      project_id: 5,
      search: 'revenue',
      date_from: '2024-01-01',
      date_to: '2024-12-31',
      page: 2,
      page_size: 10,
    }

    const { result } = renderHook(() => useHistory(filters), { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    const calledUrl = mockedGet.mock.calls[0]![0] as string
    expect(calledUrl).toContain('project_id=5')
    expect(calledUrl).toContain('search=revenue')
    expect(calledUrl).toContain('date_from=2024-01-01')
    expect(calledUrl).toContain('date_to=2024-12-31')
    expect(calledUrl).toContain('page=2')
    expect(calledUrl).toContain('page_size=10')
  })

  it('omits undefined filter values', async () => {
    mockedGet.mockResolvedValue({ data: { items: [], total: 0, has_more: false } })

    const { result } = renderHook(
      () => useHistory({ project_id: undefined, search: undefined }),
      { wrapper: createQueryWrapper() }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockedGet).toHaveBeenCalledWith('/api/history')
  })

  it('handles loading state', () => {
    mockedGet.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useHistory(), { wrapper: createQueryWrapper() })

    expect(result.current.isLoading).toBe(true)
  })

  it('handles errors', async () => {
    mockedGet.mockRejectedValue(new Error('Server error'))

    const { result } = renderHook(() => useHistory(), { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })
})
