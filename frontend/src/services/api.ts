import type {
  UploadResponse,
  AnalyzeResponse,
  QueryRequest,
  QueryResponse,
  ExportRequest,
  ExportResponse,
  ProjectCreate,
  ProjectUpdate,
  ProjectResponse,
  ProjectListResponse,
  FileInProject,
  ComparisonRequest,
  ComparisonResponse,
  RelationshipCreate,
  RelationshipResponse,
  MergeAnalyzeRequest,
  MergeAnalyzeResponse,
  FileAnalysisResponse
} from '@/types'

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

// Helper function to get auth token from localStorage
function getAuthToken(): string | null {
  return localStorage.getItem('auth_token')
}

// Helper function to create headers with authentication
function getAuthHeaders(): HeadersInit {
  const token = getAuthToken()
  const headers: HeadersInit = {}

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return headers
}

export const api = {
  async uploadFile(file: File): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders(),
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
        ...getAuthHeaders(),
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
        ...getAuthHeaders(),
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
      headers: getAuthHeaders(),
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

  // ===== Phase 7: Projects API =====

  async createProject(data: ProjectCreate): Promise<ProjectResponse> {
    const response = await fetch(`${API_BASE_URL}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(error.error || 'Create project failed', response.status, error.detail)
    }

    return response.json()
  },

  async listProjects(includeArchived = false): Promise<ProjectListResponse> {
    const url = new URL(`${API_BASE_URL}/api/projects`)
    if (includeArchived) {
      url.searchParams.append('include_archived', 'true')
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(error.error || 'List projects failed', response.status, error.detail)
    }

    return response.json()
  },

  async getProject(projectId: number): Promise<ProjectResponse> {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(error.error || 'Get project failed', response.status, error.detail)
    }

    return response.json()
  },

  async updateProject(projectId: number, data: ProjectUpdate): Promise<ProjectResponse> {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(error.error || 'Update project failed', response.status, error.detail)
    }

    return response.json()
  },

  async deleteProject(projectId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(error.error || 'Delete project failed', response.status, error.detail)
    }
  },

  async uploadFileToProject(projectId: number, file: File): Promise<any> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/files`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(error.error || 'Upload file failed', response.status, error.detail)
    }

    return response.json()
  },

  async listProjectFiles(projectId: number): Promise<FileInProject[]> {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/files`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(error.error || 'List files failed', response.status, error.detail)
    }

    return response.json()
  },

  async deleteProjectFile(projectId: number, fileId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/files/${fileId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(error.error || 'Delete file failed', response.status, error.detail)
    }
  },

  // ===== Phase 7B: File Comparison API =====

  async compareFiles(projectId: number, data: ComparisonRequest): Promise<ComparisonResponse> {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(error.error || 'Compare files failed', response.status, error.detail)
    }

    return response.json()
  },

  // ===== Phase 7C: File Merging API =====

  async createRelationship(projectId: number, data: RelationshipCreate): Promise<RelationshipResponse> {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/relationships`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(error.error || 'Create relationship failed', response.status, error.detail)
    }

    return response.json()
  },

  async listRelationships(projectId: number): Promise<RelationshipResponse[]> {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/relationships`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(error.error || 'List relationships failed', response.status, error.detail)
    }

    return response.json()
  },

  async deleteRelationship(projectId: number, relationshipId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/relationships/${relationshipId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(error.error || 'Delete relationship failed', response.status, error.detail)
    }
  },

  async analyzeMergedData(projectId: number, data: MergeAnalyzeRequest): Promise<MergeAnalyzeResponse> {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/merge-analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(error.error || 'Merge analysis failed', response.status, error.detail)
    }

    return response.json()
  },

  // Phase 7D: File Analysis
  async analyzeProjectFile(projectId: number, fileId: number, userIntent?: string): Promise<FileAnalysisResponse> {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/files/${fileId}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ user_intent: userIntent }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(error.error || 'File analysis failed', response.status, error.detail)
    }

    return response.json()
  },

  async getProjectFileAnalysis(projectId: number, fileId: number): Promise<FileAnalysisResponse> {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/files/${fileId}/analysis`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      // FastAPI returns errors in "detail" field, not "error" field
      throw new ApiError(error.detail || 'Failed to get file analysis', response.status, error.detail)
    }

    return response.json()
  },
}
