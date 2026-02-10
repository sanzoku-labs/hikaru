import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFileAnalysisFlow } from './useFileAnalysisFlow'

// Mock react-router-dom
const mockNavigate = vi.fn()
let mockLocationState: any = null

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: mockLocationState, pathname: '/projects/1/files/10/analyze' }),
}))

// Mock queries
const mockProjectFiles = [
  { id: 10, project_id: 1, filename: 'sales.csv', file_size: 1024, upload_id: 'u1', uploaded_at: '' },
]

vi.mock('@/services/api/queries/useProjectDetail', () => ({
  useProjectDetail: () => ({
    data: { id: 1, name: 'Test Project', files: mockProjectFiles },
    isLoading: false,
    error: null,
  }),
}))

let mockExistingAnalysis: any = null
let mockIsAnalysisLoading = false
vi.mock('@/services/api/queries/useFileAnalysis', () => ({
  useFileAnalysis: () => ({
    data: mockExistingAnalysis,
    isLoading: mockIsAnalysisLoading,
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

describe('useFileAnalysisFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocationState = null
    mockExistingAnalysis = null
    mockIsAnalysisLoading = false
  })

  it('returns file data from project', () => {
    const { result } = renderHook(() => useFileAnalysisFlow(1, 10))

    expect(result.current.file?.filename).toBe('sales.csv')
    expect(result.current.projectName).toBe('Test Project')
    expect(result.current.isLoading).toBe(false)
    expect(result.current.fetchError).toBeNull()
  })

  it('returns null file if not found', () => {
    const { result } = renderHook(() => useFileAnalysisFlow(1, 999))

    expect(result.current.file).toBeNull()
  })

  it('uses existing analysis from query', () => {
    mockExistingAnalysis = { charts: [{ title: 'Revenue' }], global_summary: 'Good' }

    const { result } = renderHook(() => useFileAnalysisFlow(1, 10))

    expect(result.current.analysisData).toEqual(mockExistingAnalysis)
    expect(result.current.hasExistingAnalysis).toBe(true)
  })

  it('analyzes file with user intent', async () => {
    const analysisResult = { charts: [], global_summary: 'Done' }
    mockAnalyzeMutateAsync.mockResolvedValue(analysisResult)

    const { result } = renderHook(() => useFileAnalysisFlow(1, 10))

    await act(async () => {
      await result.current.handleAnalyze('Show revenue trends')
    })

    expect(mockAnalyzeMutateAsync).toHaveBeenCalledWith({
      user_intent: 'Show revenue trends',
    })
    expect(result.current.analysisData).toEqual(analysisResult)
    expect(result.current.showReanalyzeForm).toBe(false)
  })

  it('handles analysis error', async () => {
    mockAnalyzeMutateAsync.mockRejectedValue(new Error('Analysis failed'))

    const { result } = renderHook(() => useFileAnalysisFlow(1, 10))

    await act(async () => {
      await result.current.handleAnalyze()
    })

    expect(result.current.analysisError).toBe('Analysis failed')
  })

  it('handles non-Error analysis error', async () => {
    mockAnalyzeMutateAsync.mockRejectedValue('unexpected')

    const { result } = renderHook(() => useFileAnalysisFlow(1, 10))

    await act(async () => {
      await result.current.handleAnalyze()
    })

    expect(result.current.analysisError).toBe('Failed to analyze file')
  })

  it('updates user intent', () => {
    const { result } = renderHook(() => useFileAnalysisFlow(1, 10))

    act(() => { result.current.handleUserIntentChange('new intent') })

    expect(result.current.userIntent).toBe('new intent')
  })

  it('toggles reanalyze form', () => {
    const { result } = renderHook(() => useFileAnalysisFlow(1, 10))

    expect(result.current.showReanalyzeForm).toBe(false)

    act(() => { result.current.handleToggleReanalyze() })
    expect(result.current.showReanalyzeForm).toBe(true)

    act(() => { result.current.handleToggleReanalyze() })
    expect(result.current.showReanalyzeForm).toBe(false)
  })

  it('clears user intent when toggling reanalyze form', () => {
    const { result } = renderHook(() => useFileAnalysisFlow(1, 10))

    act(() => { result.current.handleUserIntentChange('some intent') })
    act(() => { result.current.handleToggleReanalyze() })

    expect(result.current.userIntent).toBe('')
  })

  it('navigates back to project page', () => {
    const { result } = renderHook(() => useFileAnalysisFlow(1, 10))

    act(() => { result.current.navigateBack() })
    expect(mockNavigate).toHaveBeenCalledWith('/projects/1')
  })

  it('reads initial intent from location state', () => {
    mockLocationState = { userIntent: 'Pre-filled intent' }

    const { result } = renderHook(() => useFileAnalysisFlow(1, 10))

    expect(result.current.userIntent).toBe('Pre-filled intent')
  })
})
