export const ENDPOINTS = {
  // Auth
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
    HEALTH: '/api/auth/health',
  },

  // Quick Analysis (MVP)
  QUICK: {
    UPLOAD: '/api/upload',
    ANALYZE: (uploadId: string) => `/api/analyze/${uploadId}`,
    CHART_INSIGHT: (uploadId: string) => `/api/analyze/${uploadId}/chart-insight`,
    EXPORT: '/api/export',
  },

  // Q&A Chat
  QUERY: '/api/query',

  // Projects
  PROJECTS: {
    LIST: '/api/projects',
    CREATE: '/api/projects',
    DETAIL: (id: number) => `/api/projects/${id}`,
    UPDATE: (id: number) => `/api/projects/${id}`,
    DELETE: (id: number) => `/api/projects/${id}`,
    UPLOAD_FILE: (id: number) => `/api/projects/${id}/files`,
    DELETE_FILE: (projectId: number, fileId: number) => `/api/projects/${projectId}/files/${fileId}`,

    // File Analysis
    FILE_SHEETS: (projectId: number, fileId: number, preview = true) =>
      `/api/projects/${projectId}/files/${fileId}/sheets?preview=${preview}`,
    FILE_ANALYSIS: (projectId: number, fileId: number) =>
      `/api/projects/${projectId}/files/${fileId}/analysis`,
    ANALYZE_FILE: (projectId: number, fileId: number) =>
      `/api/projects/${projectId}/files/${fileId}/analyze`,

    // Comparison & Merge
    COMPARE_FILES: (projectId: number) => `/api/projects/${projectId}/compare`,
    RELATIONSHIPS: (projectId: number) => `/api/projects/${projectId}/relationships`,
    RELATIONSHIP_DETAIL: (projectId: number, relationshipId: number) =>
      `/api/projects/${projectId}/relationships/${relationshipId}`,
    MERGE_ANALYZE: (projectId: number) => `/api/projects/${projectId}/merge-analyze`,
  },

  // File Operations
  FILES: {
    COMPARE: '/api/files/compare',
    MERGE: '/api/files/merge',
  },

  // Analytics
  ANALYTICS: {
    GLOBAL: '/api/analytics', // GET - Global analytics across all projects
  },

  // Dashboards
  DASHBOARDS: {
    LIST: (projectId: number) => `/api/projects/${projectId}/dashboards`, // GET, POST
    DETAIL: (projectId: number, dashboardId: number) =>
      `/api/projects/${projectId}/dashboards/${dashboardId}`, // GET, PUT, DELETE
  },

  // Chart Insights
  CHARTS: {
    INSIGHT: '/api/charts/insight', // POST - Generate advanced insight for a chart
  },
} as const
