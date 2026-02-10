import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useFileAnalysis } from './useFileAnalysis'
import { createQueryWrapper } from '@/test/queryWrapper'

vi.mock('@/services/axios', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

import { apiClient } from '@/services/axios'

const mockedGet = vi.mocked(apiClient.get)

describe('useFileAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches file analysis by project and file ID', async () => {
    const analysisData = { charts: [{ title: 'Revenue' }], global_summary: 'Good' }
    mockedGet.mockResolvedValue({ data: analysisData })

    const { result } = renderHook(
      () => useFileAnalysis(1, 10),
      { wrapper: createQueryWrapper() }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockedGet).toHaveBeenCalledWith('/api/projects/1/files/10/analysis')
    expect(result.current.data).toEqual(analysisData)
  })

  it('is disabled when projectId is undefined', () => {
    const { result } = renderHook(
      () => useFileAnalysis(undefined, 10),
      { wrapper: createQueryWrapper() }
    )

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockedGet).not.toHaveBeenCalled()
  })

  it('is disabled when fileId is undefined', () => {
    const { result } = renderHook(
      () => useFileAnalysis(1, undefined),
      { wrapper: createQueryWrapper() }
    )

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockedGet).not.toHaveBeenCalled()
  })

  it('handles errors', async () => {
    mockedGet.mockRejectedValue(new Error('Not found'))

    const { result } = renderHook(
      () => useFileAnalysis(1, 10),
      { wrapper: createQueryWrapper() }
    )

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })
})
