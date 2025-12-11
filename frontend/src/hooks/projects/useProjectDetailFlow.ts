import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectDetail } from '@/services/api/queries/useProjectDetail'
import { useUploadProjectFile } from '@/services/api/mutations/useUploadProjectFile'
import { useFileAnalysis } from '@/services/api/queries/useFileAnalysis'
import { useAnalyzeProjectFile } from '@/services/api/mutations/useAnalyzeProjectFile'
import type { ProjectDetailResponse, ProjectFileResponse, FileAnalysisResponse } from '@/types/api'

export interface UseProjectDetailFlowReturn {
  // Data
  project: ProjectDetailResponse | null
  isLoading: boolean
  fetchError: string | null

  // Selected file & analysis
  selectedFileId: number | null
  selectedFile: ProjectFileResponse | null
  analysisData: FileAnalysisResponse | null
  isLoadingAnalysis: boolean
  analysisError: string | null

  // Re-analyze state
  showReanalyzeForm: boolean
  reanalyzeIntent: string

  // Upload form state
  showUpload: boolean
  uploadFile: File | null
  uploadIntent: string
  isUploading: boolean
  uploadError: string | null
  canSubmit: boolean

  // Handlers
  selectFile: (fileId: number) => void
  handleAnalyze: (intent?: string) => Promise<void>
  handleReanalyzeIntentChange: (intent: string) => void
  toggleReanalyzeForm: () => void
  toggleUpload: (open?: boolean) => void
  handleUploadFileSelect: (file: File) => void
  handleUploadFileRemove: () => void
  handleUploadIntentChange: (intent: string) => void
  handleUploadSubmit: () => Promise<void>
  navigateToCompare: () => void
  navigateToMerge: () => void
  navigateBack: () => void

  // Status
  isAnalyzing: boolean
}

export function useProjectDetailFlow(projectId: number): UseProjectDetailFlowReturn {
  const navigate = useNavigate()
  const projectQuery = useProjectDetail(projectId)
  const uploadMutation = useUploadProjectFile(projectId)

  // Selected file state
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null)
  const [localAnalysisData, setLocalAnalysisData] = useState<FileAnalysisResponse | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [showReanalyzeForm, setShowReanalyzeForm] = useState(false)
  const [reanalyzeIntent, setReanalyzeIntent] = useState('')

  // Upload form state
  const [showUpload, setShowUpload] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadIntent, setUploadIntent] = useState('')
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Fetch analysis for selected file
  const existingAnalysisQuery = useFileAnalysis(
    selectedFileId ? projectId : undefined,
    selectedFileId || undefined
  )
  const analyzeMutation = useAnalyzeProjectFile(projectId, selectedFileId || 0)

  // Find selected file from project files
  const selectedFile = projectQuery.data?.files?.find((f) => f.id === selectedFileId) || null

  // Use existing analysis or local state from new analysis
  const analysisData = localAnalysisData || existingAnalysisQuery.data || null

  // Auto-select first file when project loads
  useEffect(() => {
    const files = projectQuery.data?.files
    const firstFile = files?.[0]
    if (firstFile && !selectedFileId) {
      setSelectedFileId(firstFile.id)
    }
  }, [projectQuery.data?.files, selectedFileId])

  // Reset local analysis when file changes
  useEffect(() => {
    setLocalAnalysisData(null)
    setAnalysisError(null)
    setShowReanalyzeForm(false)
    setReanalyzeIntent('')
  }, [selectedFileId])

  const selectFile = useCallback((fileId: number) => {
    setSelectedFileId(fileId)
    setShowUpload(false)
  }, [])

  const handleAnalyze = useCallback(async (intent?: string) => {
    if (!selectedFileId) return
    setAnalysisError(null)
    try {
      const result = await analyzeMutation.mutateAsync({
        user_intent: intent || reanalyzeIntent || undefined,
      })
      setLocalAnalysisData(result)
      setShowReanalyzeForm(false)
      setReanalyzeIntent('')
    } catch (err) {
      setAnalysisError(
        err instanceof Error ? err.message : 'Failed to analyze file'
      )
    }
  }, [selectedFileId, analyzeMutation, reanalyzeIntent])

  const handleReanalyzeIntentChange = useCallback((intent: string) => {
    setReanalyzeIntent(intent)
  }, [])

  const toggleReanalyzeForm = useCallback(() => {
    setShowReanalyzeForm((prev) => !prev)
    setReanalyzeIntent('')
  }, [])

  const toggleUpload = useCallback((open?: boolean) => {
    setShowUpload((prev) => open ?? !prev)
    if (!open) {
      setUploadFile(null)
      setUploadIntent('')
      setUploadError(null)
    }
  }, [])

  const handleUploadFileSelect = useCallback((file: File) => {
    setUploadFile(file)
    setUploadError(null)
  }, [])

  const handleUploadFileRemove = useCallback(() => {
    setUploadFile(null)
    setUploadError(null)
  }, [])

  const handleUploadIntentChange = useCallback((intent: string) => {
    setUploadIntent(intent)
  }, [])

  const handleUploadSubmit = useCallback(async () => {
    if (!uploadFile) return

    setUploadError(null)
    try {
      const result = await uploadMutation.mutateAsync(uploadFile)
      setShowUpload(false)
      setUploadFile(null)
      setUploadIntent('')
      // Select the newly uploaded file
      setSelectedFileId(result.file_id)
      // Analysis will be triggered via the useEffect or user can click analyze
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Failed to upload file'
      )
    }
  }, [uploadFile, uploadMutation])

  const navigateToCompare = useCallback(() => {
    navigate(`/projects/${projectId}/compare`)
  }, [navigate, projectId])

  const navigateToMerge = useCallback(() => {
    navigate(`/projects/${projectId}/merge`)
  }, [navigate, projectId])

  const navigateBack = useCallback(() => {
    navigate('/projects')
  }, [navigate])

  return {
    project: projectQuery.data || null,
    isLoading: projectQuery.isLoading,
    fetchError: projectQuery.error
      ? (projectQuery.error as Error).message
      : null,

    // Selected file & analysis
    selectedFileId,
    selectedFile,
    analysisData,
    isLoadingAnalysis: existingAnalysisQuery.isLoading,
    analysisError,

    // Re-analyze state
    showReanalyzeForm,
    reanalyzeIntent,

    // Upload form state
    showUpload,
    uploadFile,
    uploadIntent,
    isUploading: uploadMutation.isPending,
    uploadError,
    canSubmit: uploadFile !== null && !uploadMutation.isPending,

    // Handlers
    selectFile,
    handleAnalyze,
    handleReanalyzeIntentChange,
    toggleReanalyzeForm,
    toggleUpload,
    handleUploadFileSelect,
    handleUploadFileRemove,
    handleUploadIntentChange,
    handleUploadSubmit,
    navigateToCompare,
    navigateToMerge,
    navigateBack,

    // Status
    isAnalyzing: analyzeMutation.isPending,
  }
}
