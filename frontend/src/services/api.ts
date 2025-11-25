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
  ProjectFileUploadResponse,
  FileInProject,
  ComparisonRequest,
  ComparisonResponse,
  RelationshipCreate,
  RelationshipResponse,
  MergeAnalyzeRequest,
  MergeAnalyzeResponse,
  FileAnalysisResponse,
  UserRegister,
  UserLogin,
  TokenResponse,
  UserResponse,
  AdvancedExportRequest,
  AdvancedExportResponse,
  DashboardCreate,
  DashboardUpdate,
  DashboardResponse,
  DashboardListResponse,
  AnalysisHistoryResponse,
  AnalysisListResponse,
  SavedAnalysisDetail,
  AnalyticsResponse,
  ChartInsightRequest,
  ChartInsightResponse,
  SheetInfo,
} from "@/types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Helper function to get auth token from localStorage
function getAuthToken(): string | null {
  return localStorage.getItem("auth_token");
}

// Helper function to create headers with authentication
function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

export const api = {
  // ===== Authentication API =====

  async register(data: UserRegister): Promise<TokenResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Registration failed",
        response.status,
        error.detail,
      );
    }

    const result = await response.json();
    // Store token in localStorage
    localStorage.setItem("auth_token", result.access_token);
    return result;
  },

  async login(data: UserLogin): Promise<TokenResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Login failed",
        response.status,
        error.detail,
      );
    }

    const result = await response.json();
    // Store token in localStorage
    localStorage.setItem("auth_token", result.access_token);
    return result;
  },

  async getCurrentUser(): Promise<UserResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Failed to get user info",
        response.status,
        error.detail,
      );
    }

    return response.json();
  },

  async logout(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Logout failed",
        response.status,
        error.detail,
      );
    }

    // Clear token from localStorage
    localStorage.removeItem("auth_token");
  },

  // ===== Upload API =====

  async uploadFile(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Upload failed",
        response.status,
        error.detail,
      );
    }

    return response.json();
  },

  async analyzeData(
    uploadId: string,
    userIntent?: string,
  ): Promise<AnalyzeResponse> {
    const url = new URL(`${API_BASE_URL}/api/analyze/${uploadId}`);
    if (userIntent) {
      url.searchParams.append("user_intent", userIntent);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Analysis failed",
        response.status,
        error.detail,
      );
    }

    return response.json();
  },

  async queryData(request: QueryRequest): Promise<QueryResponse> {
    const response = await fetch(`${API_BASE_URL}/api/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Query failed",
        response.status,
        error.detail,
      );
    }

    return response.json();
  },

  async exportDashboard(request: ExportRequest): Promise<ExportResponse> {
    const response = await fetch(`${API_BASE_URL}/api/export`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Export failed",
        response.status,
        error.detail,
      );
    }

    return response.json();
  },

  async downloadPDF(exportId: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/api/download/${exportId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Download failed",
        response.status,
        error.detail,
      );
    }

    return response.blob();
  },

  // ===== Phase 7: Projects API =====

  async createProject(data: ProjectCreate): Promise<ProjectResponse> {
    const response = await fetch(`${API_BASE_URL}/api/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Create project failed",
        response.status,
        error.detail,
      );
    }

    return response.json();
  },

  async listProjects(includeArchived = false): Promise<ProjectListResponse> {
    const url = new URL(`${API_BASE_URL}/api/projects`);
    if (includeArchived) {
      url.searchParams.append("include_archived", "true");
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "List projects failed",
        response.status,
        error.detail,
      );
    }

    return response.json();
  },

  async getProject(projectId: number): Promise<ProjectResponse> {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Get project failed",
        response.status,
        error.detail,
      );
    }

    return response.json();
  },

  async updateProject(
    projectId: number,
    data: ProjectUpdate,
  ): Promise<ProjectResponse> {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Update project failed",
        response.status,
        error.detail,
      );
    }

    return response.json();
  },

  async deleteProject(projectId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Delete project failed",
        response.status,
        error.detail,
      );
    }
  },

  async uploadFileToProject(
    projectId: number,
    file: File,
  ): Promise<ProjectFileUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/files`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Upload file failed",
        response.status,
        error.detail,
      );
    }

    return response.json();
  },

  async listProjectFiles(projectId: number): Promise<FileInProject[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/files`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "List files failed",
        response.status,
        error.detail,
      );
    }

    return response.json();
  },

  async deleteProjectFile(projectId: number, fileId: number): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/files/${fileId}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Delete file failed",
        response.status,
        error.detail,
      );
    }
  },

  async downloadProjectFile(projectId: number, fileId: number): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/files/${fileId}/download`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Download file failed",
        response.status,
        error.detail,
      );
    }

    // Get filename from Content-Disposition header or use default
    const contentDisposition = response.headers.get("Content-Disposition");
    let filename = "download";
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    // Download the file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // ===== Phase 7B: File Comparison API =====

  async compareFiles(
    projectId: number,
    data: ComparisonRequest,
  ): Promise<ComparisonResponse> {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/compare`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Compare files failed",
        response.status,
        error.detail,
      );
    }

    return response.json();
  },

  // ===== Phase 7C: File Merging API =====

  async createRelationship(
    projectId: number,
    data: RelationshipCreate,
  ): Promise<RelationshipResponse> {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/relationships`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Create relationship failed",
        response.status,
        error.detail,
      );
    }

    return response.json();
  },

  async listRelationships(projectId: number): Promise<RelationshipResponse[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/relationships`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "List relationships failed",
        response.status,
        error.detail,
      );
    }

    return response.json();
  },

  async deleteRelationship(
    projectId: number,
    relationshipId: number,
  ): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/relationships/${relationshipId}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Delete relationship failed",
        response.status,
        error.detail,
      );
    }
  },

  async analyzeMergedData(
    projectId: number,
    data: MergeAnalyzeRequest,
  ): Promise<MergeAnalyzeResponse> {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/merge-analyze`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Merge analysis failed",
        response.status,
        error.detail,
      );
    }

    return response.json();
  },

  // Multi-Sheet Excel Support
  async getFileSheets(
    projectId: number,
    fileId: number,
    preview: boolean = true,
  ): Promise<SheetInfo[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/files/${fileId}/sheets?preview=${preview}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Failed to get file sheets",
        response.status,
        error.detail,
      );
    }

    return response.json();
  },

  // Phase 7D: File Analysis
  async analyzeProjectFile(
    projectId: number,
    fileId: number,
    userIntent?: string,
    sheetName?: string,
    save: boolean = true,
  ): Promise<FileAnalysisResponse> {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/files/${fileId}/analyze?save=${save}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          user_intent: userIntent,
          sheet_name: sheetName,
        }),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "File analysis failed",
        response.status,
        error.detail,
      );
    }

    return response.json();
  },

  async getProjectFileAnalysis(
    projectId: number,
    fileId: number,
  ): Promise<FileAnalysisResponse> {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/files/${fileId}/analysis`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      // FastAPI returns errors in "detail" field, not "error" field
      throw new ApiError(
        error.detail || "Failed to get file analysis",
        response.status,
        error.detail,
      );
    }

    return response.json();
  },

  async getAnalysisHistory(
    projectId: number,
    fileId: number,
  ): Promise<AnalysisHistoryResponse> {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/files/${fileId}/analysis-history`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Failed to get analysis history",
        response.status,
        error.detail,
      );
    }

    return response.json();
  },

  // ===== Analytics API =====

  async getAnalytics(): Promise<AnalyticsResponse> {
    const response = await fetch(`${API_BASE_URL}/api/analytics`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Failed to get analytics",
        response.status,
        error.detail,
      );
    }

    return response.json();
  },

  // ===== Advanced Export API =====

  async exportAdvanced(
    request: AdvancedExportRequest,
  ): Promise<AdvancedExportResponse> {
    const response = await fetch(`${API_BASE_URL}/api/export-advanced`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Advanced export failed",
        response.status,
        error.detail,
      );
    }

    return response.json();
  },

  // ===== Dashboard CRUD API =====

  async createDashboard(
    projectId: number,
    data: DashboardCreate,
  ): Promise<DashboardResponse> {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/dashboards`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Create dashboard failed",
        response.status,
        error.detail,
      );
    }

    return response.json();
  },

  async listDashboards(projectId: number): Promise<DashboardListResponse> {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/dashboards`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "List dashboards failed",
        response.status,
        error.detail,
      );
    }

    return response.json();
  },

  async getDashboard(
    projectId: number,
    dashboardId: number,
  ): Promise<DashboardResponse> {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/dashboards/${dashboardId}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Get dashboard failed",
        response.status,
        error.detail,
      );
    }

    return response.json();
  },

  async updateDashboard(
    projectId: number,
    dashboardId: number,
    data: DashboardUpdate,
  ): Promise<DashboardResponse> {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/dashboards/${dashboardId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Update dashboard failed",
        response.status,
        error.detail,
      );
    }

    return response.json();
  },

  async deleteDashboard(projectId: number, dashboardId: number): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/dashboards/${dashboardId}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Delete dashboard failed",
        response.status,
        error.detail,
      );
    }
  },

  // ===== Chart Insights API (Phase 10) =====

  async generateChartInsight(
    request: ChartInsightRequest,
  ): Promise<ChartInsightResponse> {
    const response = await fetch(`${API_BASE_URL}/api/charts/insight`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Generate chart insight failed",
        response.status,
        error.detail,
      );
    }

    return response.json();
  },

  // Multi-Analysis Endpoints (FileAnalysis table)
  async listFileAnalyses(
    projectId: number,
    fileId: number,
  ): Promise<AnalysisListResponse> {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/files/${fileId}/analyses`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Failed to list analyses",
        response.status,
        error.detail,
      );
    }

    return response.json();
  },

  async getFileAnalysis(
    projectId: number,
    fileId: number,
    analysisId: number,
  ): Promise<SavedAnalysisDetail> {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/files/${fileId}/analyses/${analysisId}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Failed to get analysis",
        response.status,
        error.detail,
      );
    }

    return response.json();
  },

  async deleteFileAnalysis(
    projectId: number,
    fileId: number,
    analysisId: number,
  ): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/files/${fileId}/analyses/${analysisId}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Failed to delete analysis",
        response.status,
        error.detail,
      );
    }
  },
};
