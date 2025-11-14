import { Button } from '../ui/button'
import {
  ChevronDown,
  Columns,
  Layers,
  Link
} from 'lucide-react'

interface ComparisonToolbarProps {
  fileA: { id: number; name: string } | null
  fileB: { id: number; name: string } | null
  viewMode: 'side-by-side' | 'overlay'
  syncScroll: boolean
  onFileAClick: () => void
  onFileBClick: () => void
  onViewModeChange: (mode: 'side-by-side' | 'overlay') => void
  onSyncScrollToggle: () => void
}

export function ComparisonToolbar({
  fileA,
  fileB,
  viewMode,
  syncScroll,
  onFileAClick,
  onFileBClick,
  onViewModeChange,
  onSyncScrollToggle
}: ComparisonToolbarProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex items-center justify-between">
        {/* File Selectors */}
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={onFileAClick}
            className="px-4 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="mr-2">{fileA?.name || 'Select File A'}</span>
            <ChevronDown className="h-4 w-4" />
          </Button>

          <span className="text-gray-400 font-medium">vs</span>

          <Button
            variant="outline"
            onClick={onFileBClick}
            className="px-4 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="mr-2">{fileB?.name || 'Select File B'}</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>

        {/* View Mode Toggle & Sync Scroll */}
        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'side-by-side' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('side-by-side')}
              className={viewMode === 'side-by-side'
                ? 'bg-white text-gray-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-800 bg-transparent'
              }
            >
              <Columns className="mr-2 h-4 w-4" />
              Side by Side
            </Button>
            <Button
              variant={viewMode === 'overlay' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('overlay')}
              className={viewMode === 'overlay'
                ? 'bg-white text-gray-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-800 bg-transparent'
              }
            >
              <Layers className="mr-2 h-4 w-4" />
              Overlay
            </Button>
          </div>

          {/* Sync Scroll Button */}
          <Button
            variant="outline"
            onClick={onSyncScrollToggle}
            className={syncScroll
              ? 'border-primary text-primary bg-primary/5'
              : 'border-gray-300 text-gray-700'
            }
          >
            <Link className="mr-2 h-4 w-4" />
            Sync Scroll
          </Button>
        </div>
      </div>
    </div>
  )
}
