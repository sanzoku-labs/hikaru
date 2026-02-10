import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRegisterFlow } from './useRegisterFlow'

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

// Mock useRegister mutation
const mockMutateAsync = vi.fn()
vi.mock('@/services/api/mutations/useRegister', () => ({
  useRegister: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
    error: null,
  }),
}))

describe('useRegisterFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with empty form fields', () => {
    const { result } = renderHook(() => useRegisterFlow())

    expect(result.current.form.email).toBe('')
    expect(result.current.form.username).toBe('')
    expect(result.current.form.password).toBe('')
    expect(result.current.form.fullName).toBe('')
    expect(result.current.form.errors).toEqual({})
  })

  it('updates a field and clears its error', () => {
    const { result } = renderHook(() => useRegisterFlow())

    act(() => {
      result.current.setField('email', 'test@example.com')
    })

    expect(result.current.form.email).toBe('test@example.com')
  })

  describe('validation', () => {
    it('requires email', async () => {
      const { result } = renderHook(() => useRegisterFlow())

      act(() => {
        result.current.setField('username', 'testuser')
        result.current.setField('password', 'Password1')
      })

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(result.current.form.errors.email).toBe('Email is required')
      expect(mockMutateAsync).not.toHaveBeenCalled()
    })

    it('validates email format', async () => {
      const { result } = renderHook(() => useRegisterFlow())

      act(() => {
        result.current.setField('email', 'not-an-email')
        result.current.setField('username', 'testuser')
        result.current.setField('password', 'Password1')
      })

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(result.current.form.errors.email).toBe('Please enter a valid email address')
    })

    it('requires username with min length 3', async () => {
      const { result } = renderHook(() => useRegisterFlow())

      act(() => {
        result.current.setField('email', 'test@example.com')
        result.current.setField('username', 'ab')
        result.current.setField('password', 'Password1')
      })

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(result.current.form.errors.username).toBe('Username must be at least 3 characters')
    })

    it('requires password with uppercase letter', async () => {
      const { result } = renderHook(() => useRegisterFlow())

      act(() => {
        result.current.setField('email', 'test@example.com')
        result.current.setField('username', 'testuser')
        result.current.setField('password', 'password1')
      })

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(result.current.form.errors.password).toBe(
        'Password must contain at least one uppercase letter'
      )
    })

    it('requires password with number', async () => {
      const { result } = renderHook(() => useRegisterFlow())

      act(() => {
        result.current.setField('email', 'test@example.com')
        result.current.setField('username', 'testuser')
        result.current.setField('password', 'Passwords')
      })

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(result.current.form.errors.password).toBe(
        'Password must contain at least one number'
      )
    })
  })

  it('calls register mutation on valid submit', async () => {
    mockMutateAsync.mockResolvedValue({
      access_token: 'token-123',
      user: { id: 1, username: 'testuser' },
    })

    const { result } = renderHook(() => useRegisterFlow())

    act(() => {
      result.current.setField('email', 'test@example.com')
      result.current.setField('username', 'testuser')
      result.current.setField('password', 'Password1')
      result.current.setField('fullName', 'Test User')
    })

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(mockMutateAsync).toHaveBeenCalledWith({
      email: 'test@example.com',
      username: 'testuser',
      password: 'Password1',
      full_name: 'Test User',
    })
  })

  it('navigates to home after successful registration', async () => {
    mockMutateAsync.mockResolvedValue({
      access_token: 'token-123',
      user: { id: 1, username: 'testuser' },
    })

    const { result } = renderHook(() => useRegisterFlow())

    act(() => {
      result.current.setField('email', 'test@example.com')
      result.current.setField('username', 'testuser')
      result.current.setField('password', 'Password1')
    })

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
  })
})
