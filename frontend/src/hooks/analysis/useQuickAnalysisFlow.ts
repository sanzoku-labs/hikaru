import { useState, useCallback } from 'react'
import { useUploadFile } from '@/services/api/mutations/useUploadFile'
import { useAnalyzeFile } from '@/services/api/mutations/useAnalyzeFile'
import { useExportPDF } from '@/services/api/mutations/useExportPDF'
import type { UploadResponse, AnalyzeResponse } from '@/types/api'

export type UploadStage = 'idle' | 'uploading' | 'processing' | 'analyzing' | 'complete' | 'error'

export interface UseQuickAnalysisFlowReturn {
  // State
  stage: UploadStage
  selectedFile: File | null
  userIntent: string
  uploadData: UploadResponse | null
  analysisData: AnalyzeResponse | null
  error: string | null

  // Handlers
  handleFileSelect: (file: File) => void
  handleFileRemove: () => void
  handleUserIntentChange: (intent: string) => void
  handleSubmit: () => Promise<void>
  handleReset: () => void
  handleExport: () => void

  // Status
  isExporting: boolean
  canSubmit: boolean
}

export function useQuickAnalysisFlow(): UseQuickAnalysisFlowReturn {
  const [stage, setStage] = useState<UploadStage>('idle')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [userIntent, setUserIntent] = useState<string>('')
  const [uploadData, setUploadData] = useState<UploadResponse | null>(null)
  const [analysisData, setAnalysisData] = useState<AnalyzeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const uploadMutation = useUploadFile()
  const analyzeMutation = useAnalyzeFile()
  const exportMutation = useExportPDF()

  // File selection only stores the file - no upload yet
  const handleFileSelect = useCallback((file: File) => {
    setError(null)
    setSelectedFile(file)
  }, [])

  // Remove selected file before submission
  const handleFileRemove = useCallback(() => {
    setSelectedFile(null)
    setError(null)
  }, [])

  // Update user intent text
  const handleUserIntentChange = useCallback((intent: string) => {
    setUserIntent(intent)
  }, [])

  // Form submission triggers the upload → analyze flow
  const handleSubmit = useCallback(async () => {
    if (!selectedFile) return

    setError(null)
    setUploadData(null)
    setAnalysisData(null)

    try {
      // Stage 1: Upload
      setStage('uploading')
      const uploadResult = await uploadMutation.mutateAsync(selectedFile)
      setUploadData(uploadResult)

      // Stage 2: Process (brief pause to show schema)
      setStage('processing')
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Stage 3: Analyze with user intent
      setStage('analyzing')
      const analyzeResult = await analyzeMutation.mutateAsync({
        uploadId: uploadResult.upload_id,
        userIntent: userIntent.trim() || null,
      })
      setAnalysisData(analyzeResult)

      // Stage 4: Complete
      setStage('complete')
    } catch (err) {
      setStage('error')
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred. Please try again.'
      )
    }
  }, [selectedFile, userIntent, uploadMutation, analyzeMutation])

  const handleReset = useCallback(() => {
    setStage('idle')
    setSelectedFile(null)
    setUserIntent('')
    setUploadData(null)
    setAnalysisData(null)
    setError(null)
  }, [])

  const handleExport = useCallback(() => {
    if (!uploadData) return

    exportMutation.mutate({
      upload_id: uploadData.upload_id,
      filename: uploadData.filename.replace(/\.[^/.]+$/, ''), // Remove extension
    })
  }, [uploadData, exportMutation])

  return {
    stage,
    selectedFile,
    userIntent,
    uploadData,
    analysisData,
    error,
    handleFileSelect,
    handleFileRemove,
    handleUserIntentChange,
    handleSubmit,
    handleReset,
    handleExport,
    isExporting: exportMutation.isPending,
    canSubmit: selectedFile !== null && stage === 'idle',
  }
}
