import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useProjectDetailFlow } from './useProjectDetailFlow'
import type { ProjectDetailResponse } from '@/types/api'

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

// Mock queries
const mockProjectData: ProjectDetailResponse = {
  id: 1,
  name: 'Test Project',
  description: 'A test project',
  user_id: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  file_count: 2,
  files: [
    {
      id: 10,
      project_id: 1,
      filename: 'sales.csv',
      file_size: 1024,
      upload_id: 'u1',
      uploaded_at: '2024-01-01T00:00:00Z',
      data_schema: { columns: [], row_count: 100, preview: [] },
    },
    {
      id: 20,
      project_id: 1,
      filename: 'inventory.csv',
      file_size: 2048,
      upload_id: 'u2',
      uploaded_at: '2024-01-02T00:00:00Z',
      data_schema: { columns: [], row_count: 200, preview: [] },
    },
  ],
}

vi.mock('@/services/api/queries/useProjectDetail', () => ({
  useProjectDetail: () => ({
    data: mockProjectData,
    isLoading: false,
    error: null,
  }),
}))

vi.mock('@/services/api/queries/useFileAnalysis', () => ({
  useFileAnalysis: () => ({
    data: null,
    isLoading: false,
    error: null,
  }),
}))

const mockAnalyzeMutateAsync = vi.fn()
vi.mock('@/services/api/mutations/useAnalyzeProjectFile', () => ({
  useAnalyzeProjectFile: () => ({
    mutateAsync: mockAnalyzeMutateAsync,
    isPending: false,
  }),
}))

const mockUploadMutateAsync = vi.fn()
vi.mock('@/services/api/mutations/useUploadProjectFile', () => ({
  useUploadProjectFile: () => ({
    mutateAsync: mockUploadMutateAsync,
    isPending: false,
  }),
}))

describe('useProjectDetailFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns project data', () => {
    const { result } = renderHook(() => useProjectDetailFlow(1))

    expect(result.current.project).toEqual(mockProjectData)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.fetchError).toBeNull()
  })

  it('auto-selects first file', () => {
    const { result } = renderHook(() => useProjectDetailFlow(1))

    expect(result.current.selectedFileId).toBe(10)
    expect(result.current.selectedFile?.filename).toBe('sales.csv')
  })

  it('selects a different file', () => {
    const { result } = renderHook(() => useProjectDetailFlow(1))

    act(() => {
      result.current.selectFile(20)
    })

    expect(result.current.selectedFileId).toBe(20)
    expect(result.current.selectedFile?.filename).toBe('inventory.csv')
  })

  it('closes upload when selecting a file', () => {
    const { result } = renderHook(() => useProjectDetailFlow(1))

    act(() => { result.current.toggleUpload(true) })
    expect(result.current.showUpload).toBe(true)

    act(() => { result.current.selectFile(20) })
    expect(result.current.showUpload).toBe(false)
  })

  it('analyzes selected file', async () => {
    const analysisResult = { charts: [], global_summary: 'Summary' }
    mockAnalyzeMutateAsync.mockResolvedValue(analysisResult)

    const { result } = renderHook(() => useProjectDetailFlow(1))

    await act(async () => {
      await result.current.handleAnalyze('Find trends')
    })

    expect(mockAnalyzeMutateAsync).toHaveBeenCalledWith({
      user_intent: 'Find trends',
    })
    expect(result.current.analysisData).toEqual(analysisResult)
  })

  it('handles analyze error', async () => {
    mockAnalyzeMutateAsync.mockRejectedValue(new Error('Analysis failed'))

    const { result } = renderHook(() => useProjectDetailFlow(1))

    await act(async () => {
      await result.current.handleAnalyze()
    })

    expect(result.current.analysisError).toBe('Analysis failed')
  })

  it('handles non-Error analysis error', async () => {
    mockAnalyzeMutateAsync.mockRejectedValue('unexpected')

    const { result } = renderHook(() => useProjectDetailFlow(1))

    await act(async () => {
      await result.current.handleAnalyze()
    })

    expect(result.current.analysisError).toBe('Failed to analyze file')
  })

  it('toggles reanalyze form', () => {
    const { result } = renderHook(() => useProjectDetailFlow(1))

    expect(result.current.showReanalyzeForm).toBe(false)

    act(() => { result.current.toggleReanalyzeForm() })
    expect(result.current.showReanalyzeForm).toBe(true)

    act(() => { result.current.toggleReanalyzeForm() })
    expect(result.current.showReanalyzeForm).toBe(false)
  })

  it('updates reanalyze intent', () => {
    const { result } = renderHook(() => useProjectDetailFlow(1))

    act(() => { result.current.handleReanalyzeIntentChange('new intent') })
    expect(result.current.reanalyzeIntent).toBe('new intent')
  })

  it('toggles upload form', () => {
    const { result } = renderHook(() => useProjectDetailFlow(1))

    act(() => { result.current.toggleUpload(true) })
    expect(result.current.showUpload).toBe(true)

    act(() => { result.current.toggleUpload(false) })
    expect(result.current.showUpload).toBe(false)
  })

  it('manages upload file selection', () => {
    const { result } = renderHook(() => useProjectDetailFlow(1))
    const file = new File(['data'], 'new.csv', { type: 'text/csv' })

    act(() => { result.current.handleUploadFileSelect(file) })
    expect(result.current.uploadFile).toBe(file)
    expect(result.current.canSubmit).toBe(true)

    act(() => { result.current.handleUploadFileRemove() })
    expect(result.current.uploadFile).toBeNull()
    expect(result.current.canSubmit).toBe(false)
  })

  it('updates upload intent', () => {
    const { result } = renderHook(() => useProjectDetailFlow(1))

    act(() => { result.current.handleUploadIntentChange('Analyze sales') })
    expect(result.current.uploadIntent).toBe('Analyze sales')
  })

  it('handles upload submit success', async () => {
    mockUploadMutateAsync.mockResolvedValue({ file_id: 30 })

    const { result } = renderHook(() => useProjectDetailFlow(1))
    const file = new File(['data'], 'new.csv', { type: 'text/csv' })

    act(() => { result.current.handleUploadFileSelect(file) })

    await act(async () => {
      await result.current.handleUploadSubmit()
    })

    expect(mockUploadMutateAsync).toHaveBeenCalledWith(file)
    expect(result.current.showUpload).toBe(false)
    expect(result.current.uploadFile).toBeNull()
    expect(result.current.selectedFileId).toBe(30)
  })

  it('handles upload submit error', async () => {
    mockUploadMutateAsync.mockRejectedValue(new Error('Upload error'))

    const { result } = renderHook(() => useProjectDetailFlow(1))
    const file = new File(['data'], 'new.csv', { type: 'text/csv' })

    act(() => { result.current.handleUploadFileSelect(file) })

    await act(async () => {
      await result.current.handleUploadSubmit()
    })

    expect(result.current.uploadError).toBe('Upload error')
  })

  it('does nothing on upload submit without file', async () => {
    const { result } = renderHook(() => useProjectDetailFlow(1))

    await act(async () => {
      await result.current.handleUploadSubmit()
    })

    expect(mockUploadMutateAsync).not.toHaveBeenCalled()
  })

  it('navigates to compare page', () => {
    const { result } = renderHook(() => useProjectDetailFlow(1))

    act(() => { result.current.navigateToCompare() })
    expect(mockNavigate).toHaveBeenCalledWith('/projects/1/compare')
  })

  it('navigates to merge page', () => {
    const { result } = renderHook(() => useProjectDetailFlow(1))

    act(() => { result.current.navigateToMerge() })
    expect(mockNavigate).toHaveBeenCalledWith('/projects/1/merge')
  })

  it('navigates back to projects list', () => {
    const { result } = renderHook(() => useProjectDetailFlow(1))

    act(() => { result.current.navigateBack() })
    expect(mockNavigate).toHaveBeenCalledWith('/projects')
  })
})
