import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectDetail } from '@/services/api/queries/useProjectDetail'
import { useUploadProjectFile } from '@/services/api/mutations/useUploadProjectFile'
import type { ProjectDetailResponse } from '@/types/api'

export interface UseProjectDetailFlowReturn {
  // Data
  project: ProjectDetailResponse | null
  isLoading: boolean
  fetchError: string | null

  // Upload form state
  showUpload: boolean
  selectedFile: File | null
  userIntent: string
  isUploading: boolean
  uploadError: string | null
  canSubmit: boolean

  // Handlers
  toggleUpload: () => void
  handleFileSelect: (file: File) => void
  handleFileRemove: () => void
  handleUserIntentChange: (intent: string) => void
  handleUploadSubmit: () => Promise<void>
  navigateToFileAnalysis: (fileId: number, userIntent?: string) => void
  navigateToCompare: () => void
  navigateToMerge: () => void
  navigateBack: () => void
}

export function useProjectDetailFlow(projectId: number): UseProjectDetailFlowReturn {
  const navigate = useNavigate()
  const projectQuery = useProjectDetail(projectId)
  const uploadMutation = useUploadProjectFile(projectId)

  const [showUpload, setShowUpload] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [userIntent, setUserIntent] = useState('')
  const [uploadError, setUploadError] = useState<string | null>(null)

  const toggleUpload = useCallback(() => {
    setShowUpload((prev) => !prev)
    setSelectedFile(null)
    setUserIntent('')
    setUploadError(null)
  }, [])

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file)
    setUploadError(null)
  }, [])

  const handleFileRemove = useCallback(() => {
    setSelectedFile(null)
    setUploadError(null)
  }, [])

  const handleUserIntentChange = useCallback((intent: string) => {
    setUserIntent(intent)
  }, [])

  const handleUploadSubmit = useCallback(async () => {
    if (!selectedFile) return

    setUploadError(null)
    try {
      const result = await uploadMutation.mutateAsync(selectedFile)
      setShowUpload(false)
      setSelectedFile(null)
      // Navigate to analysis with user intent
      navigate(`/projects/${projectId}/files/${result.id}/analyze`, {
        state: { userIntent: userIntent.trim() || null },
      })
      setUserIntent('')
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Failed to upload file'
      )
    }
  }, [selectedFile, userIntent, uploadMutation, navigate, projectId])

  const navigateToFileAnalysis = useCallback((fileId: number, intent?: string) => {
    navigate(`/projects/${projectId}/files/${fileId}/analyze`, {
      state: intent ? { userIntent: intent } : undefined,
    })
  }, [navigate, projectId])

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
    showUpload,
    selectedFile,
    userIntent,
    isUploading: uploadMutation.isPending,
    uploadError,
    canSubmit: selectedFile !== null && !uploadMutation.isPending,
    toggleUpload,
    handleFileSelect,
    handleFileRemove,
    handleUserIntentChange,
    handleUploadSubmit,
    navigateToFileAnalysis,
    navigateToCompare,
    navigateToMerge,
    navigateBack,
  }
}
