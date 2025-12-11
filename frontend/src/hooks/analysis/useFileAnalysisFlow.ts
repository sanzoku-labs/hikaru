import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useProjectDetail } from '@/services/api/queries/useProjectDetail'
import { useFileAnalysis } from '@/services/api/queries/useFileAnalysis'
import { useAnalyzeProjectFile } from '@/services/api/mutations/useAnalyzeProjectFile'
import type { FileAnalysisResponse, ProjectFileResponse } from '@/types/api'

export interface UseFileAnalysisFlowReturn {
  // Data
  file: ProjectFileResponse | null
  projectName: string
  analysisData: FileAnalysisResponse | null
  isLoading: boolean
  fetchError: string | null

  // Re-analyze form state
  showReanalyzeForm: boolean
  userIntent: string

  // Handlers
  handleAnalyze: (intent?: string) => Promise<void>
  handleUserIntentChange: (intent: string) => void
  handleToggleReanalyze: () => void
  navigateBack: () => void

  // Status
  isAnalyzing: boolean
  analysisError: string | null
  hasExistingAnalysis: boolean
}

export function useFileAnalysisFlow(
  projectId: number,
  fileId: number
): UseFileAnalysisFlowReturn {
  const navigate = useNavigate()
  const location = useLocation()
  const projectQuery = useProjectDetail(projectId)
  const existingAnalysisQuery = useFileAnalysis(projectId, fileId)
  const analyzeMutation = useAnalyzeProjectFile(projectId, fileId)

  // Get user intent from navigation state (passed from project upload)
  const initialIntent = (location.state as { userIntent?: string })?.userIntent || ''

  const [localAnalysisData, setLocalAnalysisData] = useState<FileAnalysisResponse | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [showReanalyzeForm, setShowReanalyzeForm] = useState(false)
  const [userIntent, setUserIntent] = useState(initialIntent)

  // Find the file in the project
  const file = projectQuery.data?.files?.find((f) => f.id === fileId) || null

  // Use existing analysis from server, or local state from new analysis
  const analysisData = localAnalysisData || existingAnalysisQuery.data || null
  const hasExistingAnalysis = !!existingAnalysisQuery.data

  // Auto-analyze if we have initial intent and no existing analysis
  useEffect(() => {
    if (initialIntent && !existingAnalysisQuery.data && !existingAnalysisQuery.isLoading && !localAnalysisData) {
      handleAnalyze(initialIntent)
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingAnalysisQuery.isLoading])

  const handleAnalyze = useCallback(async (intent?: string) => {
    setAnalysisError(null)
    try {
      const result = await analyzeMutation.mutateAsync({
        user_intent: intent || userIntent || undefined,
      })
      setLocalAnalysisData(result)
      setShowReanalyzeForm(false)
      setUserIntent('')
    } catch (err) {
      setAnalysisError(
        err instanceof Error ? err.message : 'Failed to analyze file'
      )
    }
  }, [analyzeMutation, userIntent])

  const handleUserIntentChange = useCallback((intent: string) => {
    setUserIntent(intent)
  }, [])

  const handleToggleReanalyze = useCallback(() => {
    setShowReanalyzeForm((prev) => !prev)
    setUserIntent('')
  }, [])

  const navigateBack = useCallback(() => {
    navigate(`/projects/${projectId}`)
  }, [navigate, projectId])

  return {
    file,
    projectName: projectQuery.data?.name || '',
    analysisData,
    isLoading: projectQuery.isLoading || existingAnalysisQuery.isLoading,
    fetchError: projectQuery.error
      ? (projectQuery.error as Error).message
      : null,
    showReanalyzeForm,
    userIntent,
    handleAnalyze,
    handleUserIntentChange,
    handleToggleReanalyze,
    navigateBack,
    isAnalyzing: analyzeMutation.isPending,
    analysisError,
    hasExistingAnalysis,
  }
}
