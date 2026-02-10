import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useLogin } from './useLogin'
import { createQueryWrapper } from '@/test/queryWrapper'

// Mock dependencies
vi.mock('@/services/axios', () => ({
  apiClient: {
    post: vi.fn(),
  },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const mockSetAuth = vi.fn()
vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: any) => any) => selector({ setAuth: mockSetAuth }),
}))

import { apiClient } from '@/services/axios'
import { toast } from 'sonner'

const mockedPost = vi.mocked(apiClient.post)

describe('useLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls login endpoint with credentials', async () => {
    const responseData = {
      access_token: 'token-123',
      token_type: 'bearer',
      user: { id: 1, username: 'testuser', email: 'test@example.com' },
    }
    mockedPost.mockResolvedValue({ data: responseData })

    const { result } = renderHook(() => useLogin(), { wrapper: createQueryWrapper() })

    await act(async () => {
      await result.current.mutateAsync({ username: 'testuser', password: 'pass' })
    })

    expect(mockedPost).toHaveBeenCalledWith('/api/auth/login', {
      username: 'testuser',
      password: 'pass',
    })
  })

  it('sets auth on success', async () => {
    const responseData = {
      access_token: 'token-123',
      user: { id: 1, username: 'testuser' },
    }
    mockedPost.mockResolvedValue({ data: responseData })

    const { result } = renderHook(() => useLogin(), { wrapper: createQueryWrapper() })

    await act(async () => {
      await result.current.mutateAsync({ username: 'testuser', password: 'pass' })
    })

    expect(mockSetAuth).toHaveBeenCalledWith(responseData.user, 'token-123')
  })

  it('shows success toast on login', async () => {
    mockedPost.mockResolvedValue({
      data: { access_token: 'token', user: { username: 'testuser' } },
    })

    const { result } = renderHook(() => useLogin(), { wrapper: createQueryWrapper() })

    await act(async () => {
      await result.current.mutateAsync({ username: 'testuser', password: 'pass' })
    })

    expect(toast.success).toHaveBeenCalledWith('Welcome back, testuser')
  })

  it('shows error toast on failure', async () => {
    mockedPost.mockRejectedValue(new Error('Invalid'))

    const { result } = renderHook(() => useLogin(), { wrapper: createQueryWrapper() })

    await act(async () => {
      try {
        await result.current.mutateAsync({ username: 'bad', password: 'bad' })
      } catch {
        // expected
      }
    })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials')
    })
  })

  it('returns data on success', async () => {
    const responseData = {
      access_token: 'token-123',
      user: { id: 1, username: 'testuser' },
    }
    mockedPost.mockResolvedValue({ data: responseData })

    const { result } = renderHook(() => useLogin(), { wrapper: createQueryWrapper() })

    let data: any
    await act(async () => {
      data = await result.current.mutateAsync({ username: 'testuser', password: 'pass' })
    })

    expect(data).toEqual(responseData)
  })
})
