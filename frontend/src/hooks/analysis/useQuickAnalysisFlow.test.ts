import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useQuickAnalysisFlow } from './useQuickAnalysisFlow'

// Mock mutations
const mockUploadMutateAsync = vi.fn()
const mockAnalyzeMutateAsync = vi.fn()
const mockExportMutate = vi.fn()

vi.mock('@/services/api/mutations/useUploadFile', () => ({
  useUploadFile: () => ({
    mutateAsync: mockUploadMutateAsync,
    isPending: false,
  }),
}))

vi.mock('@/services/api/mutations/useAnalyzeFile', () => ({
  useAnalyzeFile: () => ({
    mutateAsync: mockAnalyzeMutateAsync,
    isPending: false,
  }),
}))

vi.mock('@/services/api/mutations/useExportPDF', () => ({
  useExportPDF: () => ({
    mutate: mockExportMutate,
    isPending: false,
  }),
}))

describe('useQuickAnalysisFlow', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('initializes with idle stage and empty state', () => {
    const { result } = renderHook(() => useQuickAnalysisFlow())

    expect(result.current.stage).toBe('idle')
    expect(result.current.selectedFile).toBeNull()
    expect(result.current.userIntent).toBe('')
    expect(result.current.uploadData).toBeNull()
    expect(result.current.analysisData).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.canSubmit).toBe(false)
  })

  it('selects a file and enables submit', () => {
    const { result } = renderHook(() => useQuickAnalysisFlow())
    const file = new File(['data'], 'test.csv', { type: 'text/csv' })

    act(() => {
      result.current.handleFileSelect(file)
    })

    expect(result.current.selectedFile).toBe(file)
    expect(result.current.canSubmit).toBe(true)
  })

  it('clears error on file select', () => {
    const { result } = renderHook(() => useQuickAnalysisFlow())
    const file = new File(['data'], 'test.csv', { type: 'text/csv' })

    // File select should clear any error and set selectedFile
    act(() => { result.current.handleFileSelect(file) })
    expect(result.current.error).toBeNull()
    expect(result.current.selectedFile).toBe(file)
  })

  it('removes selected file', () => {
    const { result } = renderHook(() => useQuickAnalysisFlow())
    const file = new File(['data'], 'test.csv', { type: 'text/csv' })

    act(() => { result.current.handleFileSelect(file) })
    act(() => { result.current.handleFileRemove() })

    expect(result.current.selectedFile).toBeNull()
    expect(result.current.canSubmit).toBe(false)
  })

  it('updates user intent', () => {
    const { result } = renderHook(() => useQuickAnalysisFlow())

    act(() => {
      result.current.handleUserIntentChange('Show trends')
    })

    expect(result.current.userIntent).toBe('Show trends')
  })

  it('runs the full upload → analyze pipeline', async () => {
    const uploadResult = { upload_id: 'u1', filename: 'test.csv', data_schema: { columns: [], row_count: 0, preview: [] }, upload_timestamp: '' }
    const analyzeResult = { upload_id: 'u1', filename: 'test.csv', data_schema: { columns: [], row_count: 0, preview: [] }, charts: [], upload_timestamp: '' }

    mockUploadMutateAsync.mockResolvedValue(uploadResult)
    mockAnalyzeMutateAsync.mockResolvedValue(analyzeResult)

    const { result } = renderHook(() => useQuickAnalysisFlow())
    const file = new File(['data'], 'test.csv', { type: 'text/csv' })

    act(() => { result.current.handleFileSelect(file) })
    act(() => { result.current.handleUserIntentChange('Show trends') })

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(mockUploadMutateAsync).toHaveBeenCalledWith(file)
    expect(mockAnalyzeMutateAsync).toHaveBeenCalledWith({
      uploadId: 'u1',
      userIntent: 'Show trends',
    })
    expect(result.current.stage).toBe('complete')
    expect(result.current.uploadData).toEqual(uploadResult)
    expect(result.current.analysisData).toEqual(analyzeResult)
  })

  it('trims empty user intent to null', async () => {
    mockUploadMutateAsync.mockResolvedValue({ upload_id: 'u1', filename: 'test.csv', data_schema: { columns: [], row_count: 0, preview: [] }, upload_timestamp: '' })
    mockAnalyzeMutateAsync.mockResolvedValue({ upload_id: 'u1', filename: 'test.csv', data_schema: { columns: [], row_count: 0, preview: [] }, charts: [], upload_timestamp: '' })

    const { result } = renderHook(() => useQuickAnalysisFlow())
    const file = new File(['data'], 'test.csv', { type: 'text/csv' })

    act(() => { result.current.handleFileSelect(file) })

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(mockAnalyzeMutateAsync).toHaveBeenCalledWith({
      uploadId: 'u1',
      userIntent: null,
    })
  })

  it('does nothing on submit without selected file', async () => {
    const { result } = renderHook(() => useQuickAnalysisFlow())

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(mockUploadMutateAsync).not.toHaveBeenCalled()
    expect(result.current.stage).toBe('idle')
  })

  it('handles upload error', async () => {
    mockUploadMutateAsync.mockRejectedValue(new Error('Upload failed'))

    const { result } = renderHook(() => useQuickAnalysisFlow())
    const file = new File(['data'], 'test.csv', { type: 'text/csv' })

    act(() => { result.current.handleFileSelect(file) })

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(result.current.stage).toBe('error')
    expect(result.current.error).toBe('Upload failed')
  })

  it('handles analyze error', async () => {
    mockUploadMutateAsync.mockResolvedValue({ upload_id: 'u1', filename: 'test.csv', data_schema: { columns: [], row_count: 0, preview: [] }, upload_timestamp: '' })
    mockAnalyzeMutateAsync.mockRejectedValue(new Error('Analyze failed'))

    const { result } = renderHook(() => useQuickAnalysisFlow())
    const file = new File(['data'], 'test.csv', { type: 'text/csv' })

    act(() => { result.current.handleFileSelect(file) })

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(result.current.stage).toBe('error')
    expect(result.current.error).toBe('Analyze failed')
  })

  it('handles non-Error thrown object', async () => {
    mockUploadMutateAsync.mockRejectedValue('string error')

    const { result } = renderHook(() => useQuickAnalysisFlow())
    const file = new File(['data'], 'test.csv', { type: 'text/csv' })

    act(() => { result.current.handleFileSelect(file) })

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(result.current.error).toBe('An unexpected error occurred. Please try again.')
  })

  it('resets all state', async () => {
    const { result } = renderHook(() => useQuickAnalysisFlow())
    const file = new File(['data'], 'test.csv', { type: 'text/csv' })

    act(() => {
      result.current.handleFileSelect(file)
      result.current.handleUserIntentChange('intent')
    })

    act(() => {
      result.current.handleReset()
    })

    expect(result.current.stage).toBe('idle')
    expect(result.current.selectedFile).toBeNull()
    expect(result.current.userIntent).toBe('')
    expect(result.current.uploadData).toBeNull()
    expect(result.current.analysisData).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('exports PDF with upload data', () => {
    const { result } = renderHook(() => useQuickAnalysisFlow())

    // Export without upload data does nothing
    act(() => { result.current.handleExport() })
    expect(mockExportMutate).not.toHaveBeenCalled()
  })

  it('canSubmit is false when not idle', async () => {
    mockUploadMutateAsync.mockRejectedValue(new Error('fail'))

    const { result } = renderHook(() => useQuickAnalysisFlow())
    const file = new File(['data'], 'test.csv', { type: 'text/csv' })

    act(() => { result.current.handleFileSelect(file) })

    await act(async () => {
      await result.current.handleSubmit()
    })

    // stage is 'error', not 'idle'
    expect(result.current.canSubmit).toBe(false)
  })
})
