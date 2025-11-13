/**
 * MergeWizard - Multi-step file merging wizard (Mockup 5)
 *
 * Features:
 * - Step 1: Select files to merge
 * - Step 2: Choose join keys and merge type
 * - Step 3: Preview and execute
 */

import { useState } from 'react'
import { Wizard, WizardStep } from '../shared/Wizard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileText, Key, GitMerge, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface File {
  id: number
  filename: string
  file_size: number
  row_count?: number
  columns: string[]
  uploaded_at: string
}

interface MergeWizardProps {
  files: File[]
  onComplete: (fileAId: number, fileBId: number, joinKey: string, mergeType: string) => Promise<void>
  onCancel: () => void
}

const mergeTypes = [
  {
    id: 'inner',
    name: 'Inner Join',
    description: 'Include only matching rows from both files',
    icon: GitMerge,
    recommended: true
  },
  {
    id: 'left',
    name: 'Left Join',
    description: 'Include all rows from first file, matching rows from second',
    icon: GitMerge,
    recommended: false
  },
  {
    id: 'right',
    name: 'Right Join',
    description: 'Include all rows from second file, matching rows from first',
    icon: GitMerge,
    recommended: false
  },
  {
    id: 'outer',
    name: 'Full Outer Join',
    description: 'Include all rows from both files',
    icon: GitMerge,
    recommended: false
  }
]

export function MergeWizard({ files, onComplete, onCancel }: MergeWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedFileA, setSelectedFileA] = useState<number | null>(null)
  const [selectedFileB, setSelectedFileB] = useState<number | null>(null)
  const [joinKey, setJoinKey] = useState<string>('')
  const [mergeType, setMergeType] = useState<string>('inner')
  const [isProcessing, setIsProcessing] = useState(false)

  const formatFileSize = (bytes: number): string => {
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const getCommonColumns = (): string[] => {
    if (!selectedFileA || !selectedFileB) return []

    const fileA = files.find(f => f.id === selectedFileA)
    const fileB = files.find(f => f.id === selectedFileB)

    if (!fileA || !fileB) return []

    return fileA.columns.filter(col => fileB.columns.includes(col))
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleFinish = async () => {
    if (selectedFileA && selectedFileB && joinKey) {
      setIsProcessing(true)
      try {
        await onComplete(selectedFileA, selectedFileB, joinKey, mergeType)
      } catch (error) {
        console.error('Merge failed:', error)
      } finally {
        setIsProcessing(false)
      }
    }
  }

  // Step 1: Select Files
  const step1Content = (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-3">Select First File (Primary)</h3>
        <div className="grid grid-cols-2 gap-3">
          {files.map((file) => (
            <button
              key={`a-${file.id}`}
              onClick={() => setSelectedFileA(file.id)}
              disabled={selectedFileB === file.id}
              className={cn(
                'p-4 rounded-lg border-2 text-left transition-all',
                'hover:border-primary hover:bg-accent/50',
                selectedFileA === file.id && 'border-primary bg-accent',
                selectedFileB === file.id && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{file.filename}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{formatFileSize(file.file_size)}</span>
                    {file.row_count && (
                      <>
                        <span>•</span>
                        <span>{file.row_count.toLocaleString()} rows</span>
                      </>
                    )}
                    <span>•</span>
                    <span>{file.columns.length} cols</span>
                  </div>
                </div>
                {selectedFileA === file.id && (
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-3">Select Second File (To Merge)</h3>
        <div className="grid grid-cols-2 gap-3">
          {files.map((file) => (
            <button
              key={`b-${file.id}`}
              onClick={() => setSelectedFileB(file.id)}
              disabled={selectedFileA === file.id}
              className={cn(
                'p-4 rounded-lg border-2 text-left transition-all',
                'hover:border-primary hover:bg-accent/50',
                selectedFileB === file.id && 'border-primary bg-accent',
                selectedFileA === file.id && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{file.filename}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{formatFileSize(file.file_size)}</span>
                    {file.row_count && (
                      <>
                        <span>•</span>
                        <span>{file.row_count.toLocaleString()} rows</span>
                      </>
                    )}
                    <span>•</span>
                    <span>{file.columns.length} cols</span>
                  </div>
                </div>
                {selectedFileB === file.id && (
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  // Step 2: Configure Merge
  const commonColumns = getCommonColumns()
  const step2Content = (
    <div className="space-y-6">
      {/* Join Key Selection */}
      <div>
        <Label htmlFor="join-key" className="text-sm font-medium mb-2 block">
          Join Key (Column to merge on)
        </Label>
        {commonColumns.length > 0 ? (
          <Select value={joinKey} onValueChange={setJoinKey}>
            <SelectTrigger id="join-key">
              <SelectValue placeholder="Select a column..." />
            </SelectTrigger>
            <SelectContent>
              {commonColumns.map((col) => (
                <SelectItem key={col} value={col}>
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-primary" />
                    <span>{col}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="p-4 rounded-lg border-2 border-warning bg-warning/10 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">No Common Columns Found</p>
              <p className="text-xs text-muted-foreground mt-1">
                The selected files don't have any columns with matching names.
                Please select different files or ensure column names match.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Merge Type Selection */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Merge Type</Label>
        <RadioGroup value={mergeType} onValueChange={setMergeType}>
          <div className="space-y-3">
            {mergeTypes.map((type) => {
              const Icon = type.icon
              return (
                <div key={type.id} className="flex items-start gap-3">
                  <RadioGroupItem value={type.id} id={type.id} className="mt-1" />
                  <Label
                    htmlFor={type.id}
                    className="flex-1 cursor-pointer p-4 rounded-lg border-2 transition-all hover:border-primary hover:bg-accent/50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{type.name}</p>
                          {type.recommended && (
                            <Badge variant="secondary" className="text-xs">Recommended</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      </div>
                    </div>
                  </Label>
                </div>
              )
            })}
          </div>
        </RadioGroup>
      </div>
    </div>
  )

  // Step 3: Review and Execute
  const step3Content = (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Merge Summary</CardTitle>
          <CardDescription>Review your selections before merging</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Primary File</p>
              <div className="p-3 rounded-lg border bg-card">
                <p className="text-sm font-medium truncate">
                  {files.find(f => f.id === selectedFileA)?.filename}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">File to Merge</p>
              <div className="p-3 rounded-lg border bg-card">
                <p className="text-sm font-medium truncate">
                  {files.find(f => f.id === selectedFileB)?.filename}
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Join Key</p>
            <div className="p-3 rounded-lg border bg-card flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">{joinKey || 'Not selected'}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Merge Type</p>
            <div className="p-3 rounded-lg border bg-card">
              <p className="text-sm font-medium">
                {mergeTypes.find(t => t.id === mergeType)?.name}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {mergeTypes.find(t => t.id === mergeType)?.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg bg-muted p-4">
        <p className="text-sm text-muted-foreground">
          Click "Merge Files" to create a new merged dataset.
          The result will be added to your project as a new file.
        </p>
      </div>
    </div>
  )

  const steps: WizardStep[] = [
    {
      id: 'select-files',
      title: 'Select Files',
      description: 'Choose two files to merge',
      content: step1Content,
      validate: () => {
        if (!selectedFileA || !selectedFileB) {
          alert('Please select both files')
          return false
        }
        return true
      }
    },
    {
      id: 'configure-merge',
      title: 'Configure Merge',
      description: 'Choose join key and merge type',
      content: step2Content,
      validate: () => {
        if (!joinKey) {
          alert('Please select a join key')
          return false
        }
        return true
      }
    },
    {
      id: 'review',
      title: 'Review & Execute',
      description: 'Review your selections',
      content: step3Content
    }
  ]

  return (
    <Wizard
      steps={steps}
      currentStep={currentStep}
      onNext={handleNext}
      onPrevious={handlePrevious}
      onFinish={handleFinish}
      onCancel={onCancel}
      isLoading={isProcessing}
      finishButtonText="Merge Files"
    />
  )
}
