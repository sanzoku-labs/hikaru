import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLoginFlow } from './useLoginFlow'

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: null, pathname: '/login' }),
}))

// Mock useLogin mutation
const mockMutateAsync = vi.fn()
vi.mock('@/services/api/mutations/useLogin', () => ({
  useLogin: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
    error: null,
  }),
}))

describe('useLoginFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with empty form fields', () => {
    const { result } = renderHook(() => useLoginFlow())

    expect(result.current.form.username).toBe('')
    expect(result.current.form.password).toBe('')
    expect(result.current.form.errors).toEqual({})
    expect(result.current.isSubmitting).toBe(false)
    expect(result.current.submitError).toBeNull()
  })

  it('updates username field and clears its error', () => {
    const { result } = renderHook(() => useLoginFlow())

    act(() => {
      result.current.setUsername('testuser')
    })

    expect(result.current.form.username).toBe('testuser')
  })

  it('updates password field and clears its error', () => {
    const { result } = renderHook(() => useLoginFlow())

    act(() => {
      result.current.setPassword('password123')
    })

    expect(result.current.form.password).toBe('password123')
  })

  it('validates empty username', async () => {
    const { result } = renderHook(() => useLoginFlow())

    act(() => {
      result.current.setPassword('password123')
    })

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(result.current.form.errors.username).toBe('Username or email is required')
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('validates empty password', async () => {
    const { result } = renderHook(() => useLoginFlow())

    act(() => {
      result.current.setUsername('testuser')
    })

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(result.current.form.errors.password).toBe('Password is required')
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('calls login mutation with trimmed credentials on valid submit', async () => {
    mockMutateAsync.mockResolvedValue({
      access_token: 'token-123',
      user: { id: 1, username: 'testuser' },
    })

    const { result } = renderHook(() => useLoginFlow())

    act(() => {
      result.current.setUsername('  testuser  ')
      result.current.setPassword('password123')
    })

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(mockMutateAsync).toHaveBeenCalledWith({
      username: 'testuser',
      password: 'password123',
    })
  })

  it('navigates to home after successful login', async () => {
    mockMutateAsync.mockResolvedValue({
      access_token: 'token-123',
      user: { id: 1, username: 'testuser' },
    })

    const { result } = renderHook(() => useLoginFlow())

    act(() => {
      result.current.setUsername('testuser')
      result.current.setPassword('password123')
    })

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
  })

  it('does not navigate on mutation failure', async () => {
    mockMutateAsync.mockRejectedValue(new Error('Invalid credentials'))

    const { result } = renderHook(() => useLoginFlow())

    act(() => {
      result.current.setUsername('testuser')
      result.current.setPassword('wrongpassword')
    })

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
