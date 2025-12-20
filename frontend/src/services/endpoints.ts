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

  // History
  HISTORY: {
    LIST: '/api/history', // GET - Paginated analysis history with filters
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

  // AI Assistant
  ASSISTANT: {
    QUERY: '/api/assistant/query', // POST - Query across multiple files
    CONVERSATIONS: '/api/assistant/conversations', // GET - List conversations
    CONVERSATION: (id: string) => `/api/assistant/conversations/${id}`, // GET, DELETE
  },

  // Reports
  REPORTS: {
    TEMPLATES: '/api/reports/templates', // GET - List available templates
    GENERATE: '/api/reports/generate', // POST - Generate a report
    LIST: '/api/reports', // GET - List generated reports
    DOWNLOAD: (reportId: string) => `/api/reports/${reportId}/download`, // GET - Download PDF
    DELETE: (reportId: string) => `/api/reports/${reportId}`, // DELETE - Delete report
  },

  // Integrations
  INTEGRATIONS: {
    PROVIDERS: '/api/integrations/providers', // GET - List available providers
    LIST: '/api/integrations', // GET - List connected integrations
    OAUTH_INITIATE: (provider: string) => `/api/integrations/${provider}/oauth/initiate`, // POST
    OAUTH_CALLBACK: (provider: string) => `/api/integrations/${provider}/oauth/callback`, // POST
    DISCONNECT: (integrationId: number) => `/api/integrations/${integrationId}`, // DELETE
    BROWSE: (integrationId: number) => `/api/integrations/${integrationId}/browse`, // GET
    IMPORT: '/api/integrations/import', // POST - Import file from provider
  },
} as const
