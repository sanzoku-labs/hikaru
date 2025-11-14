import { Button } from '../ui/button'
import { X } from 'lucide-react'

interface MergeFileCardProps {
  file: {
    id: number
    name: string
    rows: number
    columns: number
    size: string
  }
  role: 'primary' | 'secondary' | 'additional'
  onRemove?: () => void
}

const roleConfig = {
  primary: {
    label: 'Primary File',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconBg: 'bg-blue-500',
    iconColor: 'text-white'
  },
  secondary: {
    label: 'Secondary File',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    iconBg: 'bg-green-500',
    iconColor: 'text-white'
  },
  additional: {
    label: 'Additional File',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    iconBg: 'bg-purple-500',
    iconColor: 'text-white'
  }
}

export function MergeFileCard({ file, role, onRemove }: MergeFileCardProps) {
  const config = roleConfig[role]

  return (
    <div className={`border rounded-lg p-4 ${config.bgColor} ${config.borderColor}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 ${config.iconBg} rounded-lg flex items-center justify-center`}>
            <svg className={`w-4 h-4 ${config.iconColor}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{file.name}</p>
            <p className="text-xs text-gray-500">{config.label}</p>
          </div>
        </div>
        {onRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-gray-400 hover:text-red-500 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="text-xs text-gray-600">
        <span>{file.rows.toLocaleString()} rows • {file.columns} columns • {file.size}</span>
      </div>
    </div>
  )
}
