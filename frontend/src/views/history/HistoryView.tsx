import { useState, useCallback } from 'react'
import { cn, formatDate } from '@/lib/utils'
import {
  Clock,
  FileSpreadsheet,
  FolderOpen,
  Search,
  X,
  ChevronRight,
  Lightbulb,
  BarChart3,
  Calendar,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageHeaderView, LoadingSpinnerView, ErrorAlertView, EmptyStateView } from '@/views/shared'
import { useProjects } from '@/services/api/queries/useProjects'
import type { HistoryItem, HistoryFilters, ProjectResponse } from '@/types/api'

interface HistoryViewProps {
  // Data
  items: HistoryItem[]
  total: number
  isLoading: boolean
  error: string | null
  hasMore: boolean

  // Filters
  filters: HistoryFilters
  onProjectFilter: (projectId: number | null) => void
  onSearchFilter: (search: string) => void
  onDateRange: (from: string | null, to: string | null) => void
  onClearFilters: () => void

  // Pagination
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onLoadMore: () => void

  // Navigation
  onItemClick: (item: HistoryItem) => void
}

// History item card component
function HistoryItemCard({
  item,
  onClick,
}: {
  item: HistoryItem
  onClick: () => void
}) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200',
        'hover:border-primary/30 hover:shadow-[0_8px_30px_-8px_hsl(var(--primary)/0.12)]',
        'group'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary flex-shrink-0">
            <FileSpreadsheet className="h-5 w-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Filename */}
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground truncate">
                {item.filename}
              </h3>
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Project + metadata */}
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <FolderOpen className="h-3.5 w-3.5" />
              <span className="truncate">{item.project_name}</span>
              <span className="text-muted-foreground/50">·</span>
              <BarChart3 className="h-3.5 w-3.5" />
              <span>{item.charts_count} charts</span>
            </div>

            {/* User intent if present */}
            {item.user_intent && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-1">
                <span className="font-medium">Intent:</span> {item.user_intent}
              </p>
            )}

            {/* First insight preview */}
            {item.first_insight && (
              <div className="mt-2 flex items-start gap-2 p-2 rounded-md bg-amber-500/10 text-sm">
                <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-muted-foreground line-clamp-2">
                  {item.first_insight}
                </p>
              </div>
            )}
          </div>

          {/* Timestamp */}
          <div className="flex-shrink-0 text-right">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatDate(item.created_at)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Date preset buttons
const DATE_PRESETS = [
  { label: 'Today', days: 0 },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
]

export function HistoryView({
  items,
  total,
  isLoading,
  error,
  hasMore,
  filters,
  onProjectFilter,
  onSearchFilter,
  onDateRange,
  onClearFilters,
  page,
  pageSize,
  onPageChange,
  onLoadMore,
  onItemClick,
}: HistoryViewProps) {
  const [searchInput, setSearchInput] = useState(filters.search || '')
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

  // Fetch projects for filter dropdown
  const { data: projectsData } = useProjects()
  const projects = projectsData || []

  // Handle search submit
  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      onSearchFilter(searchInput)
    },
    [searchInput, onSearchFilter]
  )

  // Handle date preset click
  const handleDatePreset = useCallback(
    (days: number, label: string) => {
      setSelectedPreset(label)
      if (days === 0) {
        // Today - use substring to avoid array indexing type issues
        const today = new Date().toISOString().substring(0, 10)
        onDateRange(today, today)
      } else {
        const to = new Date()
        const from = new Date()
        from.setDate(from.getDate() - days)
        onDateRange(from.toISOString().substring(0, 10), to.toISOString().substring(0, 10))
      }
    },
    [onDateRange]
  )

  // Clear all filters
  const handleClearAll = useCallback(() => {
    setSearchInput('')
    setSelectedPreset(null)
    onClearFilters()
  }, [onClearFilters])

  // Check if any filters are active
  const hasActiveFilters =
    filters.project_id !== undefined ||
    filters.search ||
    filters.date_from ||
    filters.date_to

  // Calculate page info
  const startItem = (page - 1) * pageSize + 1
  const endItem = Math.min(page * pageSize, total)

  if (error) {
    return (
      <ErrorAlertView
        title="Failed to load history"
        message={error}
        onRetry={() => onPageChange(1)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeaderView
        title="History"
        description="Browse all your past analyses"
        compact
      />

      {/* Filters Bar */}
      <div className="space-y-4">
        {/* Search + Project Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by filename or intent..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>
          </form>

          {/* Project Filter */}
          <Select
            value={filters.project_id?.toString() || 'all'}
            onValueChange={(value) =>
              onProjectFilter(value === 'all' ? null : parseInt(value, 10))
            }
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <FolderOpen className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project: ProjectResponse) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground mr-2">Date:</span>
          {DATE_PRESETS.map((preset) => (
            <Button
              key={preset.label}
              variant={selectedPreset === preset.label ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => handleDatePreset(preset.days, preset.label)}
            >
              {preset.label}
            </Button>
          ))}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-muted-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear all
            </Button>
          )}
        </div>
      </div>

      {/* Results */}
      {isLoading && items.length === 0 ? (
        <div className="py-20">
          <LoadingSpinnerView size="lg" label="Loading history..." />
        </div>
      ) : items.length === 0 ? (
        <EmptyStateView
          icon={<Clock className="h-12 w-12" />}
          title={hasActiveFilters ? 'No results found' : 'No analysis history'}
          description={
            hasActiveFilters
              ? 'Try adjusting your filters or search terms.'
              : 'Start analyzing files to build your history.'
          }
          action={
            hasActiveFilters
              ? { label: 'Clear Filters', onClick: handleClearAll }
              : undefined
          }
        />
      ) : (
        <>
          {/* Results count */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {startItem}-{endItem} of {total} analyses
            </span>
          </div>

          {/* History items */}
          <div className="space-y-3">
            {items.map((item) => (
              <HistoryItemCard
                key={item.analysis_id}
                item={item}
                onClick={() => onItemClick(item)}
              />
            ))}
          </div>

          {/* Load more / Pagination */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={onLoadMore}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
