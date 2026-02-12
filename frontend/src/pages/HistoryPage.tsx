import { useHistoryFlow } from '@/hooks/history'
import { HistoryView } from '@/views/history'
import { AnimatedPage } from '@/components/animation'

export default function HistoryPage() {
  const flow = useHistoryFlow()

  return (
    <AnimatedPage>
      <HistoryView
        items={flow.items}
        total={flow.total}
        isLoading={flow.isLoading}
        error={flow.error}
        hasMore={flow.hasMore}
        filters={flow.filters}
        onProjectFilter={flow.setProjectFilter}
        onSearchFilter={flow.setSearchFilter}
        onDateRange={flow.setDateRange}
        onClearFilters={flow.clearFilters}
        page={flow.page}
        pageSize={flow.pageSize}
        onPageChange={flow.setPage}
        onLoadMore={flow.loadMore}
        onItemClick={flow.navigateToAnalysis}
      />
    </AnimatedPage>
  )
}
