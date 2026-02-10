import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFileMergeFlow } from './useFileMergeFlow'

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

const mockFiles = [
  {
    id: 1, project_id: 1, filename: 'sales.csv', file_size: 1024, upload_id: 'u1', uploaded_at: '',
    data_schema: { columns: [{ name: 'id', type: 'numeric' as const, null_count: 0, sample_values: [] }, { name: 'amount', type: 'numeric' as const, null_count: 0, sample_values: [] }], row_count: 100, preview: [] },
  },
  {
    id: 2, project_id: 1, filename: 'products.csv', file_size: 2048, upload_id: 'u2', uploaded_at: '',
    data_schema: { columns: [{ name: 'product_id', type: 'numeric' as const, null_count: 0, sample_values: [] }, { name: 'name', type: 'categorical' as const, null_count: 0, sample_values: [] }], row_count: 50, preview: [] },
  },
]

vi.mock('@/services/api/queries/useProjectDetail', () => ({
  useProjectDetail: () => ({
    data: { id: 1, name: 'Test Project', files: mockFiles },
    isLoading: false,
    error: null,
  }),
}))

const mockCreateRelationshipMutateAsync = vi.fn()
vi.mock('@/services/api/mutations/useCreateRelationship', () => ({
  useCreateRelationship: () => ({
    mutateAsync: mockCreateRelationshipMutateAsync,
    isPending: false,
  }),
}))

const mockMergeAnalyzeMutateAsync = vi.fn()
vi.mock('@/services/api/mutations/useMergeAnalyze', () => ({
  useMergeAnalyze: () => ({
    mutateAsync: mockMergeAnalyzeMutateAsync,
    isPending: false,
  }),
}))

describe('useFileMergeFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes at step 1 with empty state', () => {
    const { result } = renderHook(() => useFileMergeFlow(1))

    expect(result.current.currentStep).toBe(1)
    expect(result.current.projectName).toBe('Test Project')
    expect(result.current.files).toEqual(mockFiles)
    expect(result.current.selectedFileA).toBeNull()
    expect(result.current.selectedFileB).toBeNull()
    expect(result.current.joinType).toBe('inner')
    expect(result.current.canGoNext).toBe(false)
    expect(result.current.canGoBack).toBe(false)
  })

  it('selects file A and extracts columns', () => {
    const { result } = renderHook(() => useFileMergeFlow(1))

    act(() => { result.current.selectFileA(1) })

    expect(result.current.selectedFileA?.id).toBe(1)
    expect(result.current.fileAColumns).toEqual(['id', 'amount'])
  })

  it('selects file B and extracts columns', () => {
    const { result } = renderHook(() => useFileMergeFlow(1))

    act(() => { result.current.selectFileB(2) })

    expect(result.current.selectedFileB?.id).toBe(2)
    expect(result.current.fileBColumns).toEqual(['product_id', 'name'])
  })

  it('clears file B when same as A selected', () => {
    const { result } = renderHook(() => useFileMergeFlow(1))

    act(() => { result.current.selectFileB(2) })
    act(() => { result.current.selectFileA(2) })

    expect(result.current.selectedFileA?.id).toBe(2)
    expect(result.current.selectedFileB).toBeNull()
  })

  it('clears file A when same as B selected', () => {
    const { result } = renderHook(() => useFileMergeFlow(1))

    act(() => { result.current.selectFileA(1) })
    act(() => { result.current.selectFileB(1) })

    expect(result.current.selectedFileB?.id).toBe(1)
    expect(result.current.selectedFileA).toBeNull()
  })

  it('enables step 1 next when two different files selected', () => {
    const { result } = renderHook(() => useFileMergeFlow(1))

    act(() => { result.current.selectFileA(1) })
    act(() => { result.current.selectFileB(2) })

    expect(result.current.canGoNext).toBe(true)
  })

  it('navigates between steps', () => {
    const { result } = renderHook(() => useFileMergeFlow(1))

    act(() => { result.current.selectFileA(1) })
    act(() => { result.current.selectFileB(2) })
    act(() => { result.current.nextStep() })

    expect(result.current.currentStep).toBe(2)
    expect(result.current.canGoBack).toBe(true)

    act(() => { result.current.prevStep() })
    expect(result.current.currentStep).toBe(1)
  })

  it('does not advance past step 2 via nextStep', () => {
    const { result } = renderHook(() => useFileMergeFlow(1))

    act(() => { result.current.selectFileA(1) })
    act(() => { result.current.selectFileB(2) })
    act(() => { result.current.nextStep() })
    // Need keys for step 2
    act(() => { result.current.setLeftKey('id') })
    act(() => { result.current.setRightKey('product_id') })
    act(() => { result.current.nextStep() })

    // Should not go past 2 via nextStep (step 3 reached only via executeMerge)
    expect(result.current.currentStep).toBe(3)
  })

  it('enables step 2 next when keys are set', () => {
    const { result } = renderHook(() => useFileMergeFlow(1))

    act(() => { result.current.selectFileA(1) })
    act(() => { result.current.selectFileB(2) })
    act(() => { result.current.nextStep() })

    expect(result.current.canGoNext).toBe(false)

    act(() => { result.current.setLeftKey('id') })
    act(() => { result.current.setRightKey('product_id') })

    expect(result.current.canGoNext).toBe(true)
  })

  it('changes join type and resets downstream state', () => {
    const { result } = renderHook(() => useFileMergeFlow(1))

    act(() => { result.current.setJoinType('left') })
    expect(result.current.joinType).toBe('left')
  })

  it('goToStep directly sets the step', () => {
    const { result } = renderHook(() => useFileMergeFlow(1))

    act(() => { result.current.goToStep(2) })
    expect(result.current.currentStep).toBe(2)
  })

  it('resets downstream state when file A changes', () => {
    const { result } = renderHook(() => useFileMergeFlow(1))

    act(() => { result.current.selectFileA(1) })
    act(() => { result.current.selectFileB(2) })
    act(() => { result.current.setLeftKey('id') })
    act(() => { result.current.setRightKey('product_id') })

    act(() => { result.current.selectFileA(2) })
    expect(result.current.leftKey).toBe('')
    expect(result.current.rightKey).toBe('')
  })

  it('executes merge (create relationship + analyze)', async () => {
    const relationshipResult = { id: 99, file_a_id: 1, file_b_id: 2, join_type: 'inner', left_key: 'id', right_key: 'product_id' }
    const mergeResult = { merged_row_count: 50, charts: [] }

    mockCreateRelationshipMutateAsync.mockResolvedValue(relationshipResult)
    mockMergeAnalyzeMutateAsync.mockResolvedValue(mergeResult)

    const { result } = renderHook(() => useFileMergeFlow(1))

    act(() => { result.current.selectFileA(1) })
    act(() => { result.current.selectFileB(2) })
    act(() => { result.current.setLeftKey('id') })
    act(() => { result.current.setRightKey('product_id') })

    await act(async () => { await result.current.executeMerge() })

    expect(mockCreateRelationshipMutateAsync).toHaveBeenCalledWith({
      file_a_id: 1,
      file_b_id: 2,
      join_type: 'inner',
      left_key: 'id',
      right_key: 'product_id',
    })
    expect(mockMergeAnalyzeMutateAsync).toHaveBeenCalledWith({
      relationship_id: 99,
    })
    expect(result.current.relationship).toEqual(relationshipResult)
    expect(result.current.mergeResult).toEqual(mergeResult)
    expect(result.current.currentStep).toBe(3)
  })

  it('handles merge error', async () => {
    mockCreateRelationshipMutateAsync.mockRejectedValue(new Error('Merge failed'))

    const { result } = renderHook(() => useFileMergeFlow(1))

    act(() => { result.current.selectFileA(1) })
    act(() => { result.current.selectFileB(2) })
    act(() => { result.current.setLeftKey('id') })
    act(() => { result.current.setRightKey('product_id') })

    await act(async () => { await result.current.executeMerge() })

    expect(result.current.error).toBe('Merge failed')
  })

  it('does nothing on executeMerge without prerequisites', async () => {
    const { result } = renderHook(() => useFileMergeFlow(1))

    await act(async () => { await result.current.executeMerge() })

    expect(mockCreateRelationshipMutateAsync).not.toHaveBeenCalled()
  })

  it('resets all state', () => {
    const { result } = renderHook(() => useFileMergeFlow(1))

    act(() => { result.current.selectFileA(1) })
    act(() => { result.current.selectFileB(2) })
    act(() => { result.current.setLeftKey('id') })
    act(() => { result.current.setJoinType('outer') })
    act(() => { result.current.goToStep(2) })

    act(() => { result.current.reset() })

    expect(result.current.currentStep).toBe(1)
    expect(result.current.selectedFileA).toBeNull()
    expect(result.current.selectedFileB).toBeNull()
    expect(result.current.joinType).toBe('inner')
    expect(result.current.leftKey).toBe('')
    expect(result.current.rightKey).toBe('')
    expect(result.current.error).toBeNull()
  })

  it('navigates back to project page', () => {
    const { result } = renderHook(() => useFileMergeFlow(1))

    act(() => { result.current.navigateBack() })
    expect(mockNavigate).toHaveBeenCalledWith('/projects/1')
  })

  it('prevStep does nothing at step 1', () => {
    const { result } = renderHook(() => useFileMergeFlow(1))

    act(() => { result.current.prevStep() })
    expect(result.current.currentStep).toBe(1)
  })
})
