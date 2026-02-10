import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useProjects } from './useProjects'
import { createQueryWrapper } from '@/test/queryWrapper'

vi.mock('@/services/axios', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

import { apiClient } from '@/services/axios'

const mockedGet = vi.mocked(apiClient.get)

describe('useProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches projects from the API', async () => {
    const projects = [{ id: 1, name: 'Project A' }, { id: 2, name: 'Project B' }]
    mockedGet.mockResolvedValue({ data: { projects, total: 2 } })

    const { result } = renderHook(() => useProjects(), { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockedGet).toHaveBeenCalledWith('/api/projects')
    expect(result.current.data).toEqual(projects)
  })

  it('extracts projects array from response', async () => {
    mockedGet.mockResolvedValue({ data: { projects: [{ id: 1, name: 'A' }], total: 1 } })

    const { result } = renderHook(() => useProjects(), { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(result.current.data).toEqual([{ id: 1, name: 'A' }])
    })
  })

  it('returns loading state initially', () => {
    mockedGet.mockReturnValue(new Promise(() => {})) // never resolves

    const { result } = renderHook(() => useProjects(), { wrapper: createQueryWrapper() })

    expect(result.current.isLoading).toBe(true)
  })

  it('handles errors', async () => {
    mockedGet.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useProjects(), { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeTruthy()
  })
})
