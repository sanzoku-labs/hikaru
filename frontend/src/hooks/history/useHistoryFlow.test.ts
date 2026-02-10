import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useHistoryFlow } from './useHistoryFlow'

// Mock react-router-dom
const mockNavigate = vi.fn()
const mockSetSearchParams = vi.fn()
let mockSearchParams = new URLSearchParams()

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearchParams, mockSetSearchParams],
}))

// Mock useHistory query
const mockHistoryData = {
  items: [
    { id: 1, project_id: 1, file_id: 10, filename: 'sales.csv', project_name: 'P1', analyzed_at: '2024-01-01' },
    { id: 2, project_id: 1, file_id: 20, filename: 'data.csv', project_name: 'P1', analyzed_at: '2024-01-02' },
  ],
  total: 50,
  has_more: true,
}

vi.mock('@/services/api/queries/useHistory', () => ({
  useHistory: () => ({
    data: mockHistoryData,
    isLoading: false,
    error: null,
  }),
}))

describe('useHistoryFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams = new URLSearchParams()
  })

  it('returns history data', () => {
    const { result } = renderHook(() => useHistoryFlow())

    expect(result.current.items).toEqual(mockHistoryData.items)
    expect(result.current.total).toBe(50)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.hasMore).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('initializes with default filters from URL params', () => {
    const { result } = renderHook(() => useHistoryFlow())

    expect(result.current.filters.page).toBe(1)
    expect(result.current.filters.page_size).toBe(20)
    expect(result.current.filters.project_id).toBeUndefined()
    expect(result.current.filters.search).toBeUndefined()
  })

  it('reads filters from URL params', () => {
    mockSearchParams = new URLSearchParams('project_id=5&search=test&page=2')

    const { result } = renderHook(() => useHistoryFlow())

    expect(result.current.filters.project_id).toBe(5)
    expect(result.current.filters.search).toBe('test')
    expect(result.current.filters.page).toBe(2)
  })

  it('sets project filter and resets to page 1', () => {
    const { result } = renderHook(() => useHistoryFlow())

    act(() => { result.current.setProjectFilter(5) })

    expect(mockSetSearchParams).toHaveBeenCalledWith(
      expect.any(URLSearchParams),
      { replace: true }
    )
  })

  it('sets search filter', () => {
    const { result } = renderHook(() => useHistoryFlow())

    act(() => { result.current.setSearchFilter('revenue') })

    expect(mockSetSearchParams).toHaveBeenCalled()
  })

  it('sets date range', () => {
    const { result } = renderHook(() => useHistoryFlow())

    act(() => { result.current.setDateRange('2024-01-01', '2024-12-31') })

    expect(mockSetSearchParams).toHaveBeenCalled()
  })

  it('clears all filters', () => {
    const { result } = renderHook(() => useHistoryFlow())

    act(() => { result.current.clearFilters() })

    expect(mockSetSearchParams).toHaveBeenCalledWith(
      expect.any(URLSearchParams),
      { replace: true }
    )
  })

  it('sets page', () => {
    const { result } = renderHook(() => useHistoryFlow())

    act(() => { result.current.setPage(3) })

    expect(mockSetSearchParams).toHaveBeenCalled()
  })

  it('loads more data (increments page)', () => {
    const { result } = renderHook(() => useHistoryFlow())

    act(() => { result.current.loadMore() })

    expect(mockSetSearchParams).toHaveBeenCalled()
  })

  it('clears project filter with null', () => {
    const { result } = renderHook(() => useHistoryFlow())

    act(() => { result.current.setProjectFilter(null) })

    expect(mockSetSearchParams).toHaveBeenCalled()
  })

  it('clears search filter with empty string', () => {
    const { result } = renderHook(() => useHistoryFlow())

    act(() => { result.current.setSearchFilter('') })

    expect(mockSetSearchParams).toHaveBeenCalled()
  })

  it('clears date range with null values', () => {
    const { result } = renderHook(() => useHistoryFlow())

    act(() => { result.current.setDateRange(null, null) })

    expect(mockSetSearchParams).toHaveBeenCalled()
  })

  it('navigates to file analysis', () => {
    const { result } = renderHook(() => useHistoryFlow())
    const item = { id: 1, project_id: 5, file_id: 10, filename: 'test.csv', project_name: 'P', analyzed_at: '' }

    act(() => { result.current.navigateToAnalysis(item as any) })

    expect(mockNavigate).toHaveBeenCalledWith('/projects/5/files/10/analyze')
  })

  it('returns page and pageSize from filters', () => {
    const { result } = renderHook(() => useHistoryFlow())

    expect(result.current.page).toBe(1)
    expect(result.current.pageSize).toBe(20)
  })
})
