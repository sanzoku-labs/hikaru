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

  // Upload state
  showUpload: boolean
  isUploading: boolean
  uploadError: string | null

  // Handlers
  toggleUpload: () => void
  handleFileUpload: (file: File) => Promise<void>
  navigateToFileAnalysis: (fileId: number) => void
  navigateToCompare: () => void
  navigateToMerge: () => void
  navigateBack: () => void
}

export function useProjectDetailFlow(projectId: number): UseProjectDetailFlowReturn {
  const navigate = useNavigate()
  const projectQuery = useProjectDetail(projectId)
  const uploadMutation = useUploadProjectFile(projectId)

  const [showUpload, setShowUpload] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const toggleUpload = useCallback(() => {
    setShowUpload((prev) => !prev)
    setUploadError(null)
  }, [])

  const handleFileUpload = useCallback(async (file: File) => {
    setUploadError(null)
    try {
      await uploadMutation.mutateAsync(file)
      setShowUpload(false) // Close upload zone after success
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Failed to upload file'
      )
    }
  }, [uploadMutation])

  const navigateToFileAnalysis = useCallback((fileId: number) => {
    navigate(`/projects/${projectId}/files/${fileId}/analyze`)
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
    isUploading: uploadMutation.isPending,
    uploadError,
    toggleUpload,
    handleFileUpload,
    navigateToFileAnalysis,
    navigateToCompare,
    navigateToMerge,
    navigateBack,
  }
}
