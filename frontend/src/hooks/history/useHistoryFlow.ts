import { useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useHistory } from '@/services/api/queries/useHistory'
import type { HistoryFilters, HistoryItem } from '@/types/api'

export interface UseHistoryFlowReturn {
  // Data
  items: HistoryItem[]
  total: number
  isLoading: boolean
  error: string | null
  hasMore: boolean

  // Filters
  filters: HistoryFilters
  setProjectFilter: (projectId: number | null) => void
  setSearchFilter: (search: string) => void
  setDateRange: (from: string | null, to: string | null) => void
  clearFilters: () => void

  // Pagination
  page: number
  pageSize: number
  setPage: (page: number) => void
  loadMore: () => void

  // Navigation
  navigateToAnalysis: (item: HistoryItem) => void
}

export function useHistoryFlow(): UseHistoryFlowReturn {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Read filters from URL params for shareable links
  const filters: HistoryFilters = useMemo(() => {
    const projectId = searchParams.get('project_id')
    const search = searchParams.get('search')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const page = searchParams.get('page')

    return {
      project_id: projectId ? parseInt(projectId, 10) : undefined,
      search: search || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page: page ? parseInt(page, 10) : 1,
      page_size: 20,
    }
  }, [searchParams])

  // Fetch history
  const { data, isLoading, error } = useHistory(filters)

  // Update URL params (for shareable links)
  const updateParams = useCallback(
    (updates: Partial<HistoryFilters>) => {
      const newParams = new URLSearchParams()

      const newFilters = { ...filters, ...updates }

      if (newFilters.project_id !== undefined) {
        newParams.set('project_id', newFilters.project_id.toString())
      }
      if (newFilters.search) {
        newParams.set('search', newFilters.search)
      }
      if (newFilters.date_from) {
        newParams.set('date_from', newFilters.date_from)
      }
      if (newFilters.date_to) {
        newParams.set('date_to', newFilters.date_to)
      }
      // Reset to page 1 when filters change, unless page is being explicitly set
      if (updates.page !== undefined) {
        if (updates.page > 1) {
          newParams.set('page', updates.page.toString())
        }
      }

      setSearchParams(newParams, { replace: true })
    },
    [filters, setSearchParams]
  )

  // Filter handlers
  const setProjectFilter = useCallback(
    (projectId: number | null) => {
      updateParams({
        project_id: projectId ?? undefined,
        page: 1, // Reset to page 1
      })
    },
    [updateParams]
  )

  const setSearchFilter = useCallback(
    (search: string) => {
      updateParams({
        search: search || undefined,
        page: 1, // Reset to page 1
      })
    },
    [updateParams]
  )

  const setDateRange = useCallback(
    (from: string | null, to: string | null) => {
      updateParams({
        date_from: from || undefined,
        date_to: to || undefined,
        page: 1, // Reset to page 1
      })
    },
    [updateParams]
  )

  const clearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true })
  }, [setSearchParams])

  // Pagination handlers
  const setPage = useCallback(
    (page: number) => {
      updateParams({ page })
    },
    [updateParams]
  )

  const loadMore = useCallback(() => {
    if (data?.has_more) {
      setPage((filters.page || 1) + 1)
    }
  }, [data?.has_more, filters.page, setPage])

  // Navigation
  const navigateToAnalysis = useCallback(
    (item: HistoryItem) => {
      navigate(
        `/projects/${item.project_id}/files/${item.file_id}/analyze`
      )
    },
    [navigate]
  )

  return {
    // Data
    items: data?.items || [],
    total: data?.total || 0,
    isLoading,
    error: error?.message || null,
    hasMore: data?.has_more || false,

    // Filters
    filters,
    setProjectFilter,
    setSearchFilter,
    setDateRange,
    clearFilters,

    // Pagination
    page: filters.page || 1,
    pageSize: filters.page_size || 20,
    setPage,
    loadMore,

    // Navigation
    navigateToAnalysis,
  }
}
