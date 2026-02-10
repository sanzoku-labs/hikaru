import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useUploadFile } from './useUploadFile'
import { createQueryWrapper } from '@/test/queryWrapper'

vi.mock('@/services/axios', () => ({
  apiClient: {
    post: vi.fn(),
  },
}))

import { apiClient } from '@/services/axios'

const mockedPost = vi.mocked(apiClient.post)

describe('useUploadFile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uploads file with FormData', async () => {
    const uploadResponse = { upload_id: 'u1', filename: 'test.csv' }
    mockedPost.mockResolvedValue({ data: uploadResponse })

    const { result } = renderHook(() => useUploadFile(), { wrapper: createQueryWrapper() })
    const file = new File(['data'], 'test.csv', { type: 'text/csv' })

    await act(async () => {
      await result.current.mutateAsync(file)
    })

    expect(mockedPost).toHaveBeenCalledWith(
      '/api/upload',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
  })

  it('returns upload response data', async () => {
    const uploadResponse = { upload_id: 'u1', filename: 'test.csv' }
    mockedPost.mockResolvedValue({ data: uploadResponse })

    const { result } = renderHook(() => useUploadFile(), { wrapper: createQueryWrapper() })

    let data: any
    await act(async () => {
      data = await result.current.mutateAsync(new File([''], 'test.csv'))
    })

    expect(data).toEqual(uploadResponse)
  })

  it('propagates errors', async () => {
    mockedPost.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useUploadFile(), { wrapper: createQueryWrapper() })

    await expect(
      act(async () => {
        await result.current.mutateAsync(new File([''], 'test.csv'))
      })
    ).rejects.toThrow('Network error')
  })
})
