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
  uploadData: UploadResponse | null
  analysisData: AnalyzeResponse | null
  error: string | null

  // Handlers
  handleFileSelect: (file: File) => Promise<void>
  handleReset: () => void
  handleExport: () => void

  // Status
  isExporting: boolean
}

export function useQuickAnalysisFlow(): UseQuickAnalysisFlowReturn {
  const [stage, setStage] = useState<UploadStage>('idle')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadData, setUploadData] = useState<UploadResponse | null>(null)
  const [analysisData, setAnalysisData] = useState<AnalyzeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const uploadMutation = useUploadFile()
  const analyzeMutation = useAnalyzeFile()
  const exportMutation = useExportPDF()

  const handleFileSelect = useCallback(async (file: File) => {
    // Reset state
    setError(null)
    setSelectedFile(file)
    setUploadData(null)
    setAnalysisData(null)

    try {
      // Stage 1: Upload
      setStage('uploading')
      const uploadResult = await uploadMutation.mutateAsync(file)
      setUploadData(uploadResult)

      // Stage 2: Process (brief pause to show schema)
      setStage('processing')
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Stage 3: Analyze
      setStage('analyzing')
      const analyzeResult = await analyzeMutation.mutateAsync(uploadResult.upload_id)
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
  }, [uploadMutation, analyzeMutation])

  const handleReset = useCallback(() => {
    setStage('idle')
    setSelectedFile(null)
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
    uploadData,
    analysisData,
    error,
    handleFileSelect,
    handleReset,
    handleExport,
    isExporting: exportMutation.isPending,
  }
}
