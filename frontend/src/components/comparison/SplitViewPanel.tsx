import { Badge } from '../ui/badge'

interface SplitViewPanelProps {
  file: {
    id: number
    name: string
    rows: number
    columns: number
    size: string
  } | null
  data: any[]
  columns: string[]
  role: 'original' | 'comparison'
  differences?: { [key: string]: 'added' | 'removed' | 'modified' }
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void
}

export function SplitViewPanel({
  file,
  data,
  columns,
  role,
  differences,
  onScroll
}: SplitViewPanelProps) {
  if (!file) {
    return (
      <div className="flex-1 border-r border-gray-200 flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Select a file to compare</p>
      </div>
    )
  }

  const getDiffClass = (rowIndex: number): string => {
    if (!differences) return ''
    const diff = differences[rowIndex]
    switch (diff) {
      case 'added':
        return 'diff-added'
      case 'removed':
        return 'diff-removed'
      case 'modified':
        return 'diff-modified'
      default:
        return ''
    }
  }

  return (
    <div className="flex-1 border-r border-gray-200 flex flex-col">
      {/* Panel Header */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 ${role === 'original' ? 'bg-blue-100' : 'bg-green-100'} rounded-lg flex items-center justify-center`}>
              <svg className={`w-4 h-4 ${role === 'original' ? 'text-blue-600' : 'text-green-600'}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{file.name}</h3>
              <p className="text-xs text-gray-500">
                {file.rows.toLocaleString()} rows • {file.columns} columns • {file.size}
              </p>
            </div>
          </div>
          <Badge
            className={role === 'original'
              ? 'bg-blue-100 text-blue-800 hover:bg-blue-100'
              : 'bg-green-100 text-green-800 hover:bg-green-100'
            }
          >
            {role === 'original' ? 'Original' : 'Comparison'}
          </Badge>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto" onScroll={onScroll}>
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                #
              </th>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.length > 0 ? (
              data.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`hover:bg-gray-50 ${getDiffClass(rowIndex)}`}
                >
                  <td className="px-4 py-2 text-sm text-gray-500 whitespace-nowrap">
                    {rowIndex + 1}
                  </td>
                  {columns.map((col, colIndex) => (
                    <td
                      key={colIndex}
                      className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap"
                    >
                      {row[col] !== undefined && row[col] !== null
                        ? String(row[col])
                        : '-'
                      }
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
