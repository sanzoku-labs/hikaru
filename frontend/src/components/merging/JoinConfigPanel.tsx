import { Label } from '../ui/label'
import { Button } from '../ui/button'
import { ArrowRight, Eye, Play } from 'lucide-react'

interface JoinConfigPanelProps {
  joinType: 'inner' | 'left' | 'right' | 'outer'
  leftKey: string
  rightKey: string
  availableColumns: string[]
  duplicateHandling: string
  missingValuesHandling: string
  outputFormat: string
  onJoinTypeChange: (type: 'inner' | 'left' | 'right' | 'outer') => void
  onLeftKeyChange: (key: string) => void
  onRightKeyChange: (key: string) => void
  onDuplicateHandlingChange: (value: string) => void
  onMissingValuesHandlingChange: (value: string) => void
  onOutputFormatChange: (value: string) => void
  onPreview: () => void
  onExecute: () => void
}

export function JoinConfigPanel({
  joinType,
  leftKey,
  rightKey,
  availableColumns,
  duplicateHandling,
  missingValuesHandling,
  outputFormat,
  onJoinTypeChange,
  onLeftKeyChange,
  onRightKeyChange,
  onDuplicateHandlingChange,
  onMissingValuesHandlingChange,
  onOutputFormatChange,
  onPreview,
  onExecute
}: JoinConfigPanelProps) {
  return (
    <div className="space-y-6">
      {/* Join Configuration */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Join Configuration</h3>

        <div className="grid grid-cols-2 gap-6">
          {/* Join Type Selection */}
          <div>
            <Label className="block text-sm font-medium text-gray-900 mb-3">Join Type</Label>
            <div className="space-y-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="join-type"
                  value="inner"
                  checked={joinType === 'inner'}
                  onChange={() => onJoinTypeChange('inner')}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-700">Inner Join</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="join-type"
                  value="left"
                  checked={joinType === 'left'}
                  onChange={() => onJoinTypeChange('left')}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-700">Left Join</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="join-type"
                  value="right"
                  checked={joinType === 'right'}
                  onChange={() => onJoinTypeChange('right')}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-700">Right Join</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="join-type"
                  value="outer"
                  checked={joinType === 'outer'}
                  onChange={() => onJoinTypeChange('outer')}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-700">Full Outer Join</span>
              </label>
            </div>
          </div>

          {/* Key Column Mapping */}
          <div>
            <Label className="block text-sm font-medium text-gray-900 mb-3">Key Columns</Label>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-500 mb-1">Left Key</Label>
                <div className="flex items-center space-x-2">
                  <select
                    value={leftKey}
                    onChange={(e) => onLeftKeyChange(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select column</option>
                    {availableColumns.map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </div>

              <div>
                <Label className="text-xs text-gray-500 mb-1">Right Key</Label>
                <div className="flex items-center space-x-2">
                  <select
                    value={rightKey}
                    onChange={(e) => onRightKeyChange(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select column</option>
                    {availableColumns.map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Options */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Options</h3>

        <div className="grid grid-cols-3 gap-6">
          {/* Handle Duplicates */}
          <div>
            <Label className="block text-sm font-medium text-gray-900 mb-2">Handle Duplicates</Label>
            <select
              value={duplicateHandling}
              onChange={(e) => onDuplicateHandlingChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="keep_all">Keep All</option>
              <option value="remove">Remove Duplicates</option>
              <option value="keep_first">Keep First</option>
              <option value="keep_last">Keep Last</option>
            </select>
          </div>

          {/* Handle Missing Values */}
          <div>
            <Label className="block text-sm font-medium text-gray-900 mb-2">Handle Missing Values</Label>
            <select
              value={missingValuesHandling}
              onChange={(e) => onMissingValuesHandlingChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="keep_null">Keep as Null</option>
              <option value="fill_zero">Fill with Zero</option>
              <option value="fill_mean">Fill with Mean</option>
              <option value="drop_rows">Drop Rows</option>
            </select>
          </div>

          {/* Output Format */}
          <div>
            <Label className="block text-sm font-medium text-gray-900 mb-2">Output Format</Label>
            <select
              value={outputFormat}
              onChange={(e) => onOutputFormatChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="csv">CSV</option>
              <option value="xlsx">Excel (.xlsx)</option>
              <option value="json">JSON</option>
              <option value="parquet">Parquet</option>
            </select>
          </div>
        </div>
      </div>

      {/* Execute Merge */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Execute Merge</h3>
            <p className="text-sm text-gray-600 mt-1">Preview or execute the merge operation</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={onPreview}
              className="border-gray-300 text-gray-700"
            >
              <Eye className="mr-2 h-4 w-4" />
              <span>Preview</span>
            </Button>
            <Button
              onClick={onExecute}
              className="bg-primary text-white hover:bg-primary/90"
            >
              <Play className="mr-2 h-4 w-4" />
              <span>Execute Merge</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
