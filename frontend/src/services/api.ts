import type { UploadResponse, AnalyzeResponse, QueryRequest, QueryResponse, ExportRequest, ExportResponse } from '@/types'

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

  async analyzeData(uploadId: string, userIntent?: string): Promise<AnalyzeResponse> {
    const url = new URL(`${API_BASE_URL}/api/analyze/${uploadId}`)
    if (userIntent) {
      url.searchParams.append('user_intent', userIntent)
    }

    const response = await fetch(url.toString(), {
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

  async queryData(request: QueryRequest): Promise<QueryResponse> {
    const response = await fetch(`${API_BASE_URL}/api/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(
        error.error || 'Query failed',
        response.status,
        error.detail
      )
    }

    return response.json()
  },

  async exportDashboard(request: ExportRequest): Promise<ExportResponse> {
    const response = await fetch(`${API_BASE_URL}/api/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(
        error.error || 'Export failed',
        response.status,
        error.detail
      )
    }

    return response.json()
  },

  async downloadPDF(exportId: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/api/download/${exportId}`, {
      method: 'GET',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(
        error.error || 'Download failed',
        response.status,
        error.detail
      )
    }

    return response.blob()
  },
}
