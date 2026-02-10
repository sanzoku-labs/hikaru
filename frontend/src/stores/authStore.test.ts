import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from './authStore'
import type { UserResponse } from '@/types/api'

const mockUser: UserResponse = {
  id: 1,
  email: 'test@example.com',
  username: 'testuser',
  full_name: 'Test User',
  is_active: true,
  is_superuser: false,
  created_at: '2024-01-01T00:00:00Z',
}

describe('authStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
    })
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('starts with null user and unauthenticated', () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  describe('setAuth', () => {
    it('sets user, token, and isAuthenticated', () => {
      useAuthStore.getState().setAuth(mockUser, 'test-token-123')
      const state = useAuthStore.getState()

      expect(state.user).toEqual(mockUser)
      expect(state.token).toBe('test-token-123')
      expect(state.isAuthenticated).toBe(true)
    })

  })

  describe('logout', () => {
    it('clears user, token, and isAuthenticated', () => {
      // First login
      useAuthStore.getState().setAuth(mockUser, 'test-token-123')
      expect(useAuthStore.getState().isAuthenticated).toBe(true)

      // Then logout
      useAuthStore.getState().logout()
      const state = useAuthStore.getState()

      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })

  })

  describe('updateUser', () => {
    it('merges partial user data into current user', () => {
      useAuthStore.getState().setAuth(mockUser, 'test-token-123')
      useAuthStore.getState().updateUser({ full_name: 'Updated Name' })

      const state = useAuthStore.getState()
      expect(state.user?.full_name).toBe('Updated Name')
      expect(state.user?.email).toBe('test@example.com') // unchanged
    })

    it('does nothing if no user is logged in', () => {
      useAuthStore.getState().updateUser({ full_name: 'Updated Name' })
      expect(useAuthStore.getState().user).toBeNull()
    })
  })
})
