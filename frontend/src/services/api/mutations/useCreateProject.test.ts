import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useCreateProject } from './useCreateProject'
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

describe('useCreateProject', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls create project endpoint', async () => {
    mockedPost.mockResolvedValue({ data: { id: 1, name: 'New Project' } })

    const { result } = renderHook(() => useCreateProject(), { wrapper: createQueryWrapper() })

    await act(async () => {
      await result.current.mutateAsync({ name: 'New Project', description: 'Desc' })
    })

    expect(mockedPost).toHaveBeenCalledWith('/api/projects', {
      name: 'New Project',
      description: 'Desc',
    })
  })

  it('shows success toast', async () => {
    mockedPost.mockResolvedValue({ data: { id: 1, name: 'My Project' } })

    const { result } = renderHook(() => useCreateProject(), { wrapper: createQueryWrapper() })

    await act(async () => {
      await result.current.mutateAsync({ name: 'My Project' })
    })

    expect(toast.success).toHaveBeenCalledWith('Project "My Project" created')
  })

  it('shows error toast on failure', async () => {
    mockedPost.mockRejectedValue(new Error('Failed'))

    const { result } = renderHook(() => useCreateProject(), { wrapper: createQueryWrapper() })

    await act(async () => {
      try {
        await result.current.mutateAsync({ name: 'Fail' })
      } catch {
        // expected
      }
    })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to create project')
    })
  })

  it('returns created project data', async () => {
    const projectData = { id: 5, name: 'New' }
    mockedPost.mockResolvedValue({ data: projectData })

    const { result } = renderHook(() => useCreateProject(), { wrapper: createQueryWrapper() })

    let data: any
    await act(async () => {
      data = await result.current.mutateAsync({ name: 'New' })
    })

    expect(data).toEqual(projectData)
  })
})
