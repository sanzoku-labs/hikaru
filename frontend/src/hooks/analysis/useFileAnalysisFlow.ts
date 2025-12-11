import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectDetail } from '@/services/api/queries/useProjectDetail'
import { useAnalyzeProjectFile } from '@/services/api/mutations/useAnalyzeProjectFile'
import type { FileAnalysisResponse, ProjectFileResponse } from '@/types/api'

export interface UseFileAnalysisFlowReturn {
  // Data
  file: ProjectFileResponse | null
  projectName: string
  analysisData: FileAnalysisResponse | null
  isLoading: boolean
  fetchError: string | null

  // Handlers
  handleAnalyze: () => Promise<void>
  navigateBack: () => void

  // Status
  isAnalyzing: boolean
  analysisError: string | null
}

export function useFileAnalysisFlow(
  projectId: number,
  fileId: number
): UseFileAnalysisFlowReturn {
  const navigate = useNavigate()
  const projectQuery = useProjectDetail(projectId)
  const analyzeMutation = useAnalyzeProjectFile(projectId, fileId)

  const [analysisData, setAnalysisData] = useState<FileAnalysisResponse | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  // Find the file in the project
  const file = projectQuery.data?.files?.find((f) => f.id === fileId) || null

  const handleAnalyze = useCallback(async () => {
    setAnalysisError(null)
    try {
      const result = await analyzeMutation.mutateAsync({})
      setAnalysisData(result)
    } catch (err) {
      setAnalysisError(
        err instanceof Error ? err.message : 'Failed to analyze file'
      )
    }
  }, [analyzeMutation])

  const navigateBack = useCallback(() => {
    navigate(`/projects/${projectId}`)
  }, [navigate, projectId])

  return {
    file,
    projectName: projectQuery.data?.name || '',
    analysisData,
    isLoading: projectQuery.isLoading,
    fetchError: projectQuery.error
      ? (projectQuery.error as Error).message
      : null,
    handleAnalyze,
    navigateBack,
    isAnalyzing: analyzeMutation.isPending,
    analysisError,
  }
}
