import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFileComparisonFlow } from './useFileComparisonFlow'

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

const mockFiles = [
  { id: 1, project_id: 1, filename: 'sales.csv', file_size: 1024, upload_id: 'u1', uploaded_at: '' },
  { id: 2, project_id: 1, filename: 'inventory.csv', file_size: 2048, upload_id: 'u2', uploaded_at: '' },
  { id: 3, project_id: 1, filename: 'revenue.csv', file_size: 512, upload_id: 'u3', uploaded_at: '' },
]

vi.mock('@/services/api/queries/useProjectDetail', () => ({
  useProjectDetail: () => ({
    data: { id: 1, name: 'Test Project', files: mockFiles },
    isLoading: false,
    error: null,
  }),
}))

const mockCompareMutateAsync = vi.fn()
vi.mock('@/services/api/mutations/useCompareFiles', () => ({
  useCompareFiles: () => ({
    mutateAsync: mockCompareMutateAsync,
    isPending: false,
  }),
}))

describe('useFileComparisonFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with project data and empty selection', () => {
    const { result } = renderHook(() => useFileComparisonFlow(1))

    expect(result.current.projectName).toBe('Test Project')
    expect(result.current.files).toEqual(mockFiles)
    expect(result.current.selectedFileA).toBeNull()
    expect(result.current.selectedFileB).toBeNull()
    expect(result.current.comparisonType).toBe('side_by_side')
    expect(result.current.canCompare).toBe(false)
  })

  it('selects file A', () => {
    const { result } = renderHook(() => useFileComparisonFlow(1))

    act(() => { result.current.selectFileA(1) })

    expect(result.current.selectedFileA?.filename).toBe('sales.csv')
    expect(result.current.canCompare).toBe(false) // still need file B
  })

  it('selects file B', () => {
    const { result } = renderHook(() => useFileComparisonFlow(1))

    act(() => { result.current.selectFileB(2) })

    expect(result.current.selectedFileB?.filename).toBe('inventory.csv')
  })

  it('enables comparison with two different files', () => {
    const { result } = renderHook(() => useFileComparisonFlow(1))

    act(() => { result.current.selectFileA(1) })
    act(() => { result.current.selectFileB(2) })

    expect(result.current.canCompare).toBe(true)
  })

  it('clears file B when same file selected for A', () => {
    const { result } = renderHook(() => useFileComparisonFlow(1))

    act(() => { result.current.selectFileB(2) })
    act(() => { result.current.selectFileA(2) }) // same as B

    expect(result.current.selectedFileA?.id).toBe(2)
    expect(result.current.selectedFileB).toBeNull()
  })

  it('clears file A when same file selected for B', () => {
    const { result } = renderHook(() => useFileComparisonFlow(1))

    act(() => { result.current.selectFileA(1) })
    act(() => { result.current.selectFileB(1) }) // same as A

    expect(result.current.selectedFileB?.id).toBe(1)
    expect(result.current.selectedFileA).toBeNull()
  })

  it('resets comparison result when file selection changes', async () => {
    mockCompareMutateAsync.mockResolvedValue({ overlay_charts: [] })
    const { result } = renderHook(() => useFileComparisonFlow(1))

    act(() => { result.current.selectFileA(1) })
    act(() => { result.current.selectFileB(2) })

    await act(async () => { await result.current.runComparison() })
    expect(result.current.comparisonResult).toBeTruthy()

    act(() => { result.current.selectFileA(3) })
    expect(result.current.comparisonResult).toBeNull()
  })

  it('changes comparison type and resets result', () => {
    const { result } = renderHook(() => useFileComparisonFlow(1))

    act(() => { result.current.setComparisonType('trend') })
    expect(result.current.comparisonType).toBe('trend')
  })

  it('runs comparison successfully', async () => {
    const comparisonResult = { overlay_charts: [{ title: 'Chart 1' }] }
    mockCompareMutateAsync.mockResolvedValue(comparisonResult)

    const { result } = renderHook(() => useFileComparisonFlow(1))

    act(() => { result.current.selectFileA(1) })
    act(() => { result.current.selectFileB(2) })

    await act(async () => { await result.current.runComparison() })

    expect(mockCompareMutateAsync).toHaveBeenCalledWith({
      file_a_id: 1,
      file_b_id: 2,
      comparison_type: 'side_by_side',
    })
    expect(result.current.comparisonResult).toEqual(comparisonResult)
  })

  it('handles comparison error', async () => {
    mockCompareMutateAsync.mockRejectedValue(new Error('Comparison failed'))

    const { result } = renderHook(() => useFileComparisonFlow(1))

    act(() => { result.current.selectFileA(1) })
    act(() => { result.current.selectFileB(2) })

    await act(async () => { await result.current.runComparison() })

    expect(result.current.comparisonError).toBe('Comparison failed')
  })

  it('does nothing when comparison prerequisites not met', async () => {
    const { result } = renderHook(() => useFileComparisonFlow(1))

    await act(async () => { await result.current.runComparison() })

    expect(mockCompareMutateAsync).not.toHaveBeenCalled()
  })

  it('resets all state', () => {
    const { result } = renderHook(() => useFileComparisonFlow(1))

    act(() => { result.current.selectFileA(1) })
    act(() => { result.current.selectFileB(2) })
    act(() => { result.current.setComparisonType('yoy') })
    act(() => { result.current.resetComparison() })

    expect(result.current.selectedFileA).toBeNull()
    expect(result.current.selectedFileB).toBeNull()
    expect(result.current.comparisonType).toBe('side_by_side')
    expect(result.current.comparisonResult).toBeNull()
  })

  it('navigates back to project detail', () => {
    const { result } = renderHook(() => useFileComparisonFlow(1))

    act(() => { result.current.navigateBack() })
    expect(mockNavigate).toHaveBeenCalledWith('/projects/1')
  })
})
