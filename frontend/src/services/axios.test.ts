import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'

// We need to test the interceptors. Since they're registered on module load,
// we'll test them by inspecting the behavior of the configured apiClient.

describe('axios interceptors', () => {
  let apiClient: typeof import('./axios').apiClient

  beforeEach(async () => {
    vi.restoreAllMocks()
    localStorage.clear()

    // Re-import to get fresh instance
    vi.resetModules()
    const mod = await import('./axios')
    apiClient = mod.apiClient
  })

  describe('request interceptor', () => {
    it('attaches Bearer token when present in localStorage', async () => {
      localStorage.setItem('token', 'my-jwt-token')

      // Use interceptors manually
      const config = { headers: axios.defaults.headers.common } as any
      config.headers = { ...config.headers }

      // Get the request interceptor
      const interceptor = (apiClient.interceptors.request as any).handlers[0]
      const result = interceptor.fulfilled({
        ...config,
        headers: new axios.AxiosHeaders(),
      })

      expect(result.headers.get('Authorization')).toBe('Bearer my-jwt-token')
    })

    it('does not attach token when not in localStorage', async () => {
      const interceptor = (apiClient.interceptors.request as any).handlers[0]
      const headers = new axios.AxiosHeaders()
      const result = interceptor.fulfilled({ headers })

      expect(result.headers.get('Authorization')).toBeFalsy()
    })
  })

  describe('response interceptor', () => {
    it('passes through successful responses', async () => {
      const interceptor = (apiClient.interceptors.response as any).handlers[0]
      const response = { status: 200, data: { ok: true } }

      const result = interceptor.fulfilled(response)
      expect(result).toBe(response)
    })

    it('handles 401 by clearing storage and redirecting', async () => {
      localStorage.setItem('token', 'old-token')
      localStorage.setItem('user', 'user-data')

      // Mock window.location
      const originalHref = window.location.href
      Object.defineProperty(window, 'location', {
        value: { href: originalHref },
        writable: true,
        configurable: true,
      })

      const interceptor = (apiClient.interceptors.response as any).handlers[0]
      const error = {
        response: { status: 401, data: {} },
        message: 'Unauthorized',
      }

      await expect(interceptor.rejected(error)).rejects.toThrow('Session expired. Please log in again.')
      expect(localStorage.getItem('token')).toBeNull()
      expect(localStorage.getItem('user')).toBeNull()
      expect(window.location.href).toBe('/login')
    })

    it('handles 403 with permission error', async () => {
      const interceptor = (apiClient.interceptors.response as any).handlers[0]
      const error = { response: { status: 403, data: {} }, message: '' }

      await expect(interceptor.rejected(error)).rejects.toThrow(
        'You do not have permission to perform this action.'
      )
    })

    it('handles 404 with not found error', async () => {
      const interceptor = (apiClient.interceptors.response as any).handlers[0]
      const error = { response: { status: 404, data: {} }, message: '' }

      await expect(interceptor.rejected(error)).rejects.toThrow('Resource not found.')
    })

    it('handles 500 with server error', async () => {
      const interceptor = (apiClient.interceptors.response as any).handlers[0]
      const error = { response: { status: 500, data: {} }, message: '' }

      await expect(interceptor.rejected(error)).rejects.toThrow(
        'Server error. Please try again later.'
      )
    })

    it('extracts detail from backend response', async () => {
      const interceptor = (apiClient.interceptors.response as any).handlers[0]
      const error = {
        response: { status: 422, data: { detail: 'Validation failed' } },
        message: 'Request failed',
      }

      await expect(interceptor.rejected(error)).rejects.toThrow('Validation failed')
    })

    it('falls back to error.message when no detail', async () => {
      const interceptor = (apiClient.interceptors.response as any).handlers[0]
      const error = {
        response: { status: 422, data: {} },
        message: 'Network Error',
      }

      await expect(interceptor.rejected(error)).rejects.toThrow('Network Error')
    })
  })
})
