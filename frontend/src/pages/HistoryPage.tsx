import { useHistoryFlow } from '@/hooks/history'
import { HistoryView } from '@/views/history'

export default function HistoryPage() {
  const flow = useHistoryFlow()

  return (
    <HistoryView
      // Data
      items={flow.items}
      total={flow.total}
      isLoading={flow.isLoading}
      error={flow.error}
      hasMore={flow.hasMore}
      // Filters
      filters={flow.filters}
      onProjectFilter={flow.setProjectFilter}
      onSearchFilter={flow.setSearchFilter}
      onDateRange={flow.setDateRange}
      onClearFilters={flow.clearFilters}
      // Pagination
      page={flow.page}
      pageSize={flow.pageSize}
      onPageChange={flow.setPage}
      onLoadMore={flow.loadMore}
      // Navigation
      onItemClick={flow.navigateToAnalysis}
    />
  )
}
