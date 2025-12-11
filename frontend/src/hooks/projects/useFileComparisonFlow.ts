import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectDetail } from '@/services/api/queries/useProjectDetail'
import { useCompareFiles } from '@/services/api/mutations/useCompareFiles'
import type {
  ProjectFileResponse,
  ComparisonResponse,
  CompareFilesRequest,
} from '@/types/api'

export type ComparisonType = 'trend' | 'yoy' | 'side_by_side'

export interface UseFileComparisonFlowReturn {
  // Project data
  projectName: string
  files: ProjectFileResponse[]
  isLoading: boolean
  fetchError: string | null

  // Selection state
  selectedFileA: ProjectFileResponse | null
  selectedFileB: ProjectFileResponse | null
  comparisonType: ComparisonType

  // Comparison result
  comparisonResult: ComparisonResponse | null
  isComparing: boolean
  comparisonError: string | null

  // Handlers
  selectFileA: (fileId: number) => void
  selectFileB: (fileId: number) => void
  setComparisonType: (type: ComparisonType) => void
  runComparison: () => Promise<void>
  resetComparison: () => void
  navigateBack: () => void

  // Validation
  canCompare: boolean
}

export function useFileComparisonFlow(projectId: number): UseFileComparisonFlowReturn {
  const navigate = useNavigate()
  const projectQuery = useProjectDetail(projectId)
  const compareMutation = useCompareFiles(projectId)

  // Selection state
  const [fileAId, setFileAId] = useState<number | null>(null)
  const [fileBId, setFileBId] = useState<number | null>(null)
  const [comparisonType, setComparisonType] = useState<ComparisonType>('side_by_side')

  // Comparison result
  const [comparisonResult, setComparisonResult] = useState<ComparisonResponse | null>(null)
  const [comparisonError, setComparisonError] = useState<string | null>(null)

  const files = projectQuery.data?.files || []
  const projectName = projectQuery.data?.name || 'Project'

  // Find selected files
  const selectedFileA = useMemo(
    () => files.find((f) => f.id === fileAId) || null,
    [files, fileAId]
  )

  const selectedFileB = useMemo(
    () => files.find((f) => f.id === fileBId) || null,
    [files, fileBId]
  )

  // Validation
  const canCompare = useMemo(
    () => fileAId !== null && fileBId !== null && fileAId !== fileBId,
    [fileAId, fileBId]
  )

  const selectFileA = useCallback((fileId: number) => {
    setFileAId(fileId)
    // If same as file B, clear B
    if (fileId === fileBId) {
      setFileBId(null)
    }
    // Reset results when selection changes
    setComparisonResult(null)
    setComparisonError(null)
  }, [fileBId])

  const selectFileB = useCallback((fileId: number) => {
    setFileBId(fileId)
    // If same as file A, clear A
    if (fileId === fileAId) {
      setFileAId(null)
    }
    // Reset results when selection changes
    setComparisonResult(null)
    setComparisonError(null)
  }, [fileAId])

  const handleSetComparisonType = useCallback((type: ComparisonType) => {
    setComparisonType(type)
    // Reset results when type changes
    setComparisonResult(null)
    setComparisonError(null)
  }, [])

  const runComparison = useCallback(async () => {
    if (!canCompare || !fileAId || !fileBId) return

    setComparisonError(null)
    try {
      const request: CompareFilesRequest = {
        file_a_id: fileAId,
        file_b_id: fileBId,
        comparison_type: comparisonType,
      }
      const result = await compareMutation.mutateAsync(request)
      setComparisonResult(result)
    } catch (err) {
      setComparisonError(
        err instanceof Error ? err.message : 'Failed to compare files'
      )
    }
  }, [canCompare, fileAId, fileBId, comparisonType, compareMutation])

  const resetComparison = useCallback(() => {
    setFileAId(null)
    setFileBId(null)
    setComparisonType('side_by_side')
    setComparisonResult(null)
    setComparisonError(null)
  }, [])

  const navigateBack = useCallback(() => {
    navigate(`/projects/${projectId}`)
  }, [navigate, projectId])

  return {
    // Project data
    projectName,
    files,
    isLoading: projectQuery.isLoading,
    fetchError: projectQuery.error
      ? (projectQuery.error as Error).message
      : null,

    // Selection state
    selectedFileA,
    selectedFileB,
    comparisonType,

    // Comparison result
    comparisonResult,
    isComparing: compareMutation.isPending,
    comparisonError,

    // Handlers
    selectFileA,
    selectFileB,
    setComparisonType: handleSetComparisonType,
    runComparison,
    resetComparison,
    navigateBack,

    // Validation
    canCompare,
  }
}
