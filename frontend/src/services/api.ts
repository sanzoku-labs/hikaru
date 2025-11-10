import type { UploadResponse, AnalyzeResponse } from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export const api = {
  async uploadFile(file: File): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(
        error.error || 'Upload failed',
        response.status,
        error.detail
      )
    }

    return response.json()
  },

  async analyzeData(uploadId: string): Promise<AnalyzeResponse> {
    const response = await fetch(`${API_BASE_URL}/api/analyze/${uploadId}`, {
      method: 'GET',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(
        error.error || 'Analysis failed',
        response.status,
        error.detail
      )
    }

    return response.json()
  },
}
