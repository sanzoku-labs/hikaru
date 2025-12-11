import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectDetail } from '@/services/api/queries/useProjectDetail'
import { useCreateRelationship } from '@/services/api/mutations/useCreateRelationship'
import { useMergeAnalyze } from '@/services/api/mutations/useMergeAnalyze'
import type {
  ProjectFileResponse,
  RelationshipResponse,
  MergeAnalyzeResponse,
  DataSchema,
} from '@/types/api'

export type JoinType = 'inner' | 'left' | 'right' | 'outer'
export type MergeStep = 1 | 2 | 3

export interface UseFileMergeFlowReturn {
  // Project data
  projectName: string
  files: ProjectFileResponse[]
  isLoading: boolean
  fetchError: string | null

  // Wizard state
  currentStep: MergeStep
  canGoNext: boolean
  canGoBack: boolean

  // Step 1: File Selection
  selectedFileA: ProjectFileResponse | null
  selectedFileB: ProjectFileResponse | null
  joinType: JoinType

  // Step 2: Key Mapping
  leftKey: string
  rightKey: string
  fileAColumns: string[]
  fileBColumns: string[]

  // Step 3: Results
  relationship: RelationshipResponse | null
  mergeResult: MergeAnalyzeResponse | null
  isCreatingRelationship: boolean
  isAnalyzing: boolean
  error: string | null

  // Handlers
  selectFileA: (fileId: number) => void
  selectFileB: (fileId: number) => void
  setJoinType: (type: JoinType) => void
  setLeftKey: (key: string) => void
  setRightKey: (key: string) => void
  goToStep: (step: MergeStep) => void
  nextStep: () => void
  prevStep: () => void
  executeMerge: () => Promise<void>
  reset: () => void
  navigateBack: () => void
}

function extractColumns(schema: DataSchema | null | undefined): string[] {
  if (!schema?.columns) return []
  return schema.columns.map((col) => col.name)
}

export function useFileMergeFlow(projectId: number): UseFileMergeFlowReturn {
  const navigate = useNavigate()
  const projectQuery = useProjectDetail(projectId)
  const createRelationshipMutation = useCreateRelationship(projectId)
  const mergeAnalyzeMutation = useMergeAnalyze(projectId)

  // Wizard state
  const [currentStep, setCurrentStep] = useState<MergeStep>(1)

  // Step 1: File Selection
  const [fileAId, setFileAId] = useState<number | null>(null)
  const [fileBId, setFileBId] = useState<number | null>(null)
  const [joinType, setJoinType] = useState<JoinType>('inner')

  // Step 2: Key Mapping
  const [leftKey, setLeftKey] = useState<string>('')
  const [rightKey, setRightKey] = useState<string>('')

  // Step 3: Results
  const [relationship, setRelationship] = useState<RelationshipResponse | null>(null)
  const [mergeResult, setMergeResult] = useState<MergeAnalyzeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  // Extract column names from schemas
  const fileAColumns = useMemo(
    () => extractColumns(selectedFileA?.data_schema),
    [selectedFileA]
  )

  const fileBColumns = useMemo(
    () => extractColumns(selectedFileB?.data_schema),
    [selectedFileB]
  )

  // Validation for each step
  const canGoNext = useMemo(() => {
    if (currentStep === 1) {
      return fileAId !== null && fileBId !== null && fileAId !== fileBId
    }
    if (currentStep === 2) {
      return leftKey !== '' && rightKey !== ''
    }
    return false
  }, [currentStep, fileAId, fileBId, leftKey, rightKey])

  const canGoBack = currentStep > 1

  const selectFileA = useCallback((fileId: number) => {
    setFileAId(fileId)
    if (fileId === fileBId) {
      setFileBId(null)
    }
    // Reset downstream state
    setLeftKey('')
    setRightKey('')
    setRelationship(null)
    setMergeResult(null)
    setError(null)
  }, [fileBId])

  const selectFileB = useCallback((fileId: number) => {
    setFileBId(fileId)
    if (fileId === fileAId) {
      setFileAId(null)
    }
    // Reset downstream state
    setLeftKey('')
    setRightKey('')
    setRelationship(null)
    setMergeResult(null)
    setError(null)
  }, [fileAId])

  const handleSetJoinType = useCallback((type: JoinType) => {
    setJoinType(type)
    setRelationship(null)
    setMergeResult(null)
    setError(null)
  }, [])

  const handleSetLeftKey = useCallback((key: string) => {
    setLeftKey(key)
    setRelationship(null)
    setMergeResult(null)
    setError(null)
  }, [])

  const handleSetRightKey = useCallback((key: string) => {
    setRightKey(key)
    setRelationship(null)
    setMergeResult(null)
    setError(null)
  }, [])

  const goToStep = useCallback((step: MergeStep) => {
    setCurrentStep(step)
  }, [])

  const nextStep = useCallback(() => {
    if (canGoNext && currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as MergeStep)
    }
  }, [canGoNext, currentStep])

  const prevStep = useCallback(() => {
    if (canGoBack) {
      setCurrentStep((prev) => (prev - 1) as MergeStep)
    }
  }, [canGoBack])

  const executeMerge = useCallback(async () => {
    if (!fileAId || !fileBId || !leftKey || !rightKey) return

    setError(null)
    try {
      // Step 1: Create relationship
      const relationshipResult = await createRelationshipMutation.mutateAsync({
        file_a_id: fileAId,
        file_b_id: fileBId,
        join_type: joinType,
        left_key: leftKey,
        right_key: rightKey,
      })
      setRelationship(relationshipResult)

      // Step 2: Analyze merged data
      const analyzeResult = await mergeAnalyzeMutation.mutateAsync({
        relationship_id: relationshipResult.id,
      })
      setMergeResult(analyzeResult)

      // Move to results step
      setCurrentStep(3)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to merge files'
      )
    }
  }, [fileAId, fileBId, leftKey, rightKey, joinType, createRelationshipMutation, mergeAnalyzeMutation])

  const reset = useCallback(() => {
    setCurrentStep(1)
    setFileAId(null)
    setFileBId(null)
    setJoinType('inner')
    setLeftKey('')
    setRightKey('')
    setRelationship(null)
    setMergeResult(null)
    setError(null)
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

    // Wizard state
    currentStep,
    canGoNext,
    canGoBack,

    // Step 1
    selectedFileA,
    selectedFileB,
    joinType,

    // Step 2
    leftKey,
    rightKey,
    fileAColumns,
    fileBColumns,

    // Step 3
    relationship,
    mergeResult,
    isCreatingRelationship: createRelationshipMutation.isPending,
    isAnalyzing: mergeAnalyzeMutation.isPending,
    error,

    // Handlers
    selectFileA,
    selectFileB,
    setJoinType: handleSetJoinType,
    setLeftKey: handleSetLeftKey,
    setRightKey: handleSetRightKey,
    goToStep,
    nextStep,
    prevStep,
    executeMerge,
    reset,
    navigateBack,
  }
}
