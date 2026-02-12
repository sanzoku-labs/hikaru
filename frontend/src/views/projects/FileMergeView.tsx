import { cn } from '@/lib/utils'
import { formatFileSize } from '@/lib/utils'
import {
  Merge,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Play,
  RotateCcw,
  Check,
  CircleDot,
  Save,
} from 'lucide-react'
import { PageHeaderView, EmptyStateView, LoadingSpinnerView, ErrorAlertView } from '@/views/shared'
import { EmptyFilesSpot, EmptyAnalyticsSpot } from '@/components/illustrations'
import { GlobalSummaryView } from '@/views/analysis'
import { ChartGridView } from '@/views/charts'
import { SaveDashboardDialog } from '@/views/dashboards'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type {
  ProjectFileResponse,
  RelationshipResponse,
  MergeAnalyzeResponse,
} from '@/types/api'
import type { JoinType, MergeStep } from '@/hooks/projects/useFileMergeFlow'

interface FileMergeViewProps {
  // Project data
  projectName: string
  files: ProjectFileResponse[]
  isLoading: boolean
  fetchError: string | null

  // Wizard state
  currentStep: MergeStep
  canGoNext: boolean
  canGoBack: boolean

  // Step 1
  selectedFileA: ProjectFileResponse | null
  selectedFileB: ProjectFileResponse | null
  joinType: JoinType

  // Step 2
  leftKey: string
  rightKey: string
  fileAColumns: string[]
  fileBColumns: string[]

  // Step 3 - relationship stored for reference but may not be displayed
  relationship: RelationshipResponse | null
  mergeResult: MergeAnalyzeResponse | null
  isCreatingRelationship: boolean
  isAnalyzing: boolean
  error: string | null

  // Handlers
  onSelectFileA: (fileId: number) => void
  onSelectFileB: (fileId: number) => void
  onJoinTypeChange: (type: JoinType) => void
  onLeftKeyChange: (key: string) => void
  onRightKeyChange: (key: string) => void
  onNextStep: () => void
  onPrevStep: () => void
  onExecuteMerge: () => void
  onReset: () => void
  onBackClick: () => void

  // Save as Dashboard
  showSaveDialog: boolean
  isSavingDashboard: boolean
  onOpenSaveDialog: () => void
  onCloseSaveDialog: () => void
  onSaveDashboard: (name: string) => void
}

const joinTypes: { value: JoinType; label: string; description: string }[] = [
  {
    value: 'inner',
    label: 'Inner Join',
    description: 'Only rows with matching keys in both files',
  },
  {
    value: 'left',
    label: 'Left Join',
    description: 'All rows from first file, matching rows from second',
  },
  {
    value: 'right',
    label: 'Right Join',
    description: 'All rows from second file, matching rows from first',
  },
  {
    value: 'outer',
    label: 'Full Outer Join',
    description: 'All rows from both files, matched where possible',
  },
]

function StepIndicator({ step, currentStep, label }: { step: number; currentStep: number; label: string }) {
  const isComplete = currentStep > step
  const isCurrent = currentStep === step

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
          isComplete && 'bg-primary text-primary-foreground',
          isCurrent && 'bg-primary/20 text-primary border-2 border-primary',
          !isComplete && !isCurrent && 'bg-muted text-muted-foreground'
        )}
      >
        {isComplete ? <Check className="h-4 w-4" /> : step}
      </div>
      <span
        className={cn(
          'text-sm font-medium',
          isCurrent ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {label}
      </span>
    </div>
  )
}

export function FileMergeView({
  projectName,
  files,
  isLoading,
  fetchError,
  currentStep,
  canGoNext,
  canGoBack,
  selectedFileA,
  selectedFileB,
  joinType,
  leftKey,
  rightKey,
  fileAColumns,
  fileBColumns,
  relationship: _relationship,
  mergeResult,
  isCreatingRelationship,
  isAnalyzing,
  error,
  onSelectFileA,
  onSelectFileB,
  onJoinTypeChange,
  onLeftKeyChange,
  onRightKeyChange,
  onNextStep,
  onPrevStep,
  onExecuteMerge,
  onReset,
  onBackClick,
  // Save as Dashboard
  showSaveDialog,
  isSavingDashboard,
  onOpenSaveDialog,
  onCloseSaveDialog,
  onSaveDashboard,
}: FileMergeViewProps) {
  const hasResult = !!mergeResult
  const isMerging = isCreatingRelationship || isAnalyzing

  if (isLoading) {
    return (
      <div className="py-20">
        <LoadingSpinnerView size="lg" label="Loading project..." />
      </div>
    )
  }

  if (fetchError) {
    return (
      <ErrorAlertView
        title="Failed to load project"
        message={fetchError}
        onRetry={onBackClick}
      />
    )
  }

  if (files.length < 2) {
    return (
      <div className="py-20">
        <EmptyStateView
          illustration={<EmptyFilesSpot />}
          icon={<Merge className="h-12 w-12" />}
          title="Not enough files"
          description="You need at least 2 files in this project to merge them."
          action={{ label: 'Go Back', onClick: onBackClick }}
        />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <PageHeaderView
        title="Merge Files"
        description={`Combine data from multiple files in ${projectName}`}
        backButton={{ label: 'Back to Project', onClick: onBackClick }}
        compact
        actions={
          hasResult ? (
            <button
              onClick={onReset}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
                'bg-secondary text-secondary-foreground font-medium text-sm',
                'transition-colors hover:bg-secondary/80'
              )}
            >
              <RotateCcw className="h-4 w-4" />
              New Merge
            </button>
          ) : null
        }
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Step Indicator */}
        {!hasResult && (
          <div className="flex items-center justify-center gap-8 py-6 border-b border-border mb-6">
            <StepIndicator step={1} currentStep={currentStep} label="Select Files" />
            <div className="h-px w-12 bg-border" />
            <StepIndicator step={2} currentStep={currentStep} label="Map Keys" />
            <div className="h-px w-12 bg-border" />
            <StepIndicator step={3} currentStep={currentStep} label="Review & Merge" />
          </div>
        )}

        {/* Step 1: Select Files & Join Type */}
        {currentStep === 1 && !hasResult && (
          <div className="space-y-6 pb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                  Select Files to Merge
                </CardTitle>
                <CardDescription>
                  Choose two files and the type of join operation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* File Selection Row */}
                <div className="flex items-center gap-4">
                  {/* File A */}
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="merge-file-a">First File (Left)</Label>
                    <Select
                      value={selectedFileA?.id?.toString() || ''}
                      onValueChange={(val) => onSelectFileA(Number(val))}
                    >
                      <SelectTrigger id="merge-file-a" className="w-full">
                        <SelectValue placeholder="Select first file..." />
                      </SelectTrigger>
                      <SelectContent>
                        {files.map((file) => (
                          <SelectItem
                            key={file.id}
                            value={file.id.toString()}
                            disabled={file.id === selectedFileB?.id}
                          >
                            <div className="flex items-center gap-2">
                              <FileSpreadsheet className="h-4 w-4" />
                              <span>{file.filename}</span>
                              <span className="text-muted-foreground text-xs">
                                ({formatFileSize(file.file_size)})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedFileA && (
                      <p className="text-xs text-muted-foreground">
                        {selectedFileA.data_schema?.row_count?.toLocaleString() || '?'} rows ·{' '}
                        {selectedFileA.data_schema?.columns?.length || '?'} columns
                      </p>
                    )}
                  </div>

                  {/* Arrow */}
                  <div className="flex-shrink-0 pt-6">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Merge className="h-5 w-5 text-primary" />
                    </div>
                  </div>

                  {/* File B */}
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="merge-file-b">Second File (Right)</Label>
                    <Select
                      value={selectedFileB?.id?.toString() || ''}
                      onValueChange={(val) => onSelectFileB(Number(val))}
                    >
                      <SelectTrigger id="merge-file-b" className="w-full">
                        <SelectValue placeholder="Select second file..." />
                      </SelectTrigger>
                      <SelectContent>
                        {files.map((file) => (
                          <SelectItem
                            key={file.id}
                            value={file.id.toString()}
                            disabled={file.id === selectedFileA?.id}
                          >
                            <div className="flex items-center gap-2">
                              <FileSpreadsheet className="h-4 w-4" />
                              <span>{file.filename}</span>
                              <span className="text-muted-foreground text-xs">
                                ({formatFileSize(file.file_size)})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedFileB && (
                      <p className="text-xs text-muted-foreground">
                        {selectedFileB.data_schema?.row_count?.toLocaleString() || '?'} rows ·{' '}
                        {selectedFileB.data_schema?.columns?.length || '?'} columns
                      </p>
                    )}
                  </div>
                </div>

                {/* Join Type Selection */}
                <div className="space-y-3">
                  <Label>Join Type</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {joinTypes.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => onJoinTypeChange(type.value)}
                        className={cn(
                          'flex items-start gap-3 p-4 rounded-lg border text-left transition-all',
                          joinType === type.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        <CircleDot
                          className={cn(
                            'h-5 w-5 flex-shrink-0 mt-0.5',
                            joinType === type.value ? 'text-primary' : 'text-muted-foreground'
                          )}
                        />
                        <div>
                          <span
                            className={cn(
                              'font-medium text-sm block',
                              joinType === type.value ? 'text-primary' : 'text-foreground'
                            )}
                          >
                            {type.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {type.description}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Key Mapping */}
        {currentStep === 2 && !hasResult && (
          <div className="space-y-6 pb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Merge className="h-5 w-5 text-primary" />
                  Map Join Keys
                </CardTitle>
                <CardDescription>
                  Select which columns to use for matching rows between files
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Key Mapping Row */}
                <div className="flex items-center gap-4">
                  {/* Left Key */}
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="left-key">
                      Column from{' '}
                      <span className="text-primary">{selectedFileA?.filename || 'First File'}</span>
                    </Label>
                    <Select value={leftKey} onValueChange={onLeftKeyChange}>
                      <SelectTrigger id="left-key" className="w-full">
                        <SelectValue placeholder="Select column..." />
                      </SelectTrigger>
                      <SelectContent>
                        {fileAColumns.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Arrow */}
                  <div className="flex-shrink-0 pt-6">
                    <div className="p-2 rounded-full bg-muted">
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Right Key */}
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="right-key">
                      Column from{' '}
                      <span className="text-primary">{selectedFileB?.filename || 'Second File'}</span>
                    </Label>
                    <Select value={rightKey} onValueChange={onRightKeyChange}>
                      <SelectTrigger id="right-key" className="w-full">
                        <SelectValue placeholder="Select column..." />
                      </SelectTrigger>
                      <SelectContent>
                        {fileBColumns.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Hint */}
                {leftKey && rightKey && (
                  <div className="p-4 rounded-lg bg-muted/50 text-sm">
                    <p className="text-muted-foreground">
                      Rows will be matched where{' '}
                      <code className="px-1 py-0.5 bg-muted rounded text-primary">{leftKey}</code>
                      {' '}equals{' '}
                      <code className="px-1 py-0.5 bg-muted rounded text-primary">{rightKey}</code>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Error */}
            {error && (
              <ErrorAlertView
                title="Configuration error"
                message={error}
              />
            )}
          </div>
        )}

        {/* Step 3: Review & Execute or Results */}
        {currentStep === 3 && (
          <div className="space-y-6 pb-8">
            {/* Merging in progress */}
            {isMerging && (
              <div className="py-12">
                <LoadingSpinnerView
                  size="lg"
                  label={isCreatingRelationship ? 'Creating relationship...' : 'Analyzing merged data...'}
                />
              </div>
            )}

            {/* Error */}
            {error && !isMerging && (
              <ErrorAlertView
                title="Merge failed"
                message={error}
                onRetry={onExecuteMerge}
              />
            )}

            {/* Review before merge (no result yet) */}
            {!hasResult && !isMerging && !error && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    Review Merge Configuration
                  </CardTitle>
                  <CardDescription>
                    Confirm the settings below and execute the merge
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">First File</p>
                      <p className="font-medium">{selectedFileA?.filename}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Key: <code className="text-primary">{leftKey}</code>
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Second File</p>
                      <p className="font-medium">{selectedFileB?.filename}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Key: <code className="text-primary">{rightKey}</code>
                      </p>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Join Type</p>
                    <p className="font-medium capitalize">{joinType} Join</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results */}
            {hasResult && (
              <>
                {/* Merge Summary */}
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-center gap-4">
                      <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
                        <FileSpreadsheet className="h-4 w-4 text-blue-500" />
                        <span className="font-medium text-sm">
                          {selectedFileA?.filename}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Merge className="h-5 w-5 text-primary" />
                        <span className="text-sm text-muted-foreground capitalize">
                          {joinType}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
                        <FileSpreadsheet className="h-4 w-4 text-purple-500" />
                        <span className="font-medium text-sm">
                          {selectedFileB?.filename}
                        </span>
                      </div>
                    </div>
                    <div className="text-center mt-4">
                      <p className="text-sm text-muted-foreground">
                        Merged result:{' '}
                        <span className="font-medium text-foreground">
                          {mergeResult.merged_row_count.toLocaleString()} rows
                        </span>
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Summary */}
                {mergeResult.global_summary && (
                  <GlobalSummaryView summary={mergeResult.global_summary} />
                )}

                {/* Charts */}
                {mergeResult.charts && mergeResult.charts.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold text-foreground">
                          Merged Data Analysis
                        </h3>
                        <span className="text-sm text-muted-foreground">
                          ({mergeResult.charts.length} charts)
                        </span>
                      </div>
                      <button
                        onClick={onOpenSaveDialog}
                        className={cn(
                          'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
                          'bg-secondary text-secondary-foreground font-medium text-sm',
                          'transition-colors hover:bg-secondary/80'
                        )}
                      >
                        <Save className="h-4 w-4" />
                        Save as Dashboard
                      </button>
                    </div>
                    <ChartGridView charts={mergeResult.charts} />
                  </div>
                )}

                {/* No charts */}
                {mergeResult.charts?.length === 0 && (
                  <EmptyStateView
                    illustration={<EmptyAnalyticsSpot size={120} />}
                    icon={<Merge className="h-10 w-10" />}
                    title="No charts generated"
                    description="The merged data doesn't have suitable columns for visualization."
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        {!hasResult && (
          <div className="sticky bottom-0 bg-background border-t border-border p-4 flex justify-between">
            <button
              onClick={canGoBack ? onPrevStep : onBackClick}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
                'bg-secondary text-secondary-foreground font-medium text-sm',
                'transition-colors hover:bg-secondary/80'
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              {canGoBack ? 'Back' : 'Cancel'}
            </button>

            {currentStep < 3 ? (
              <button
                onClick={onNextStep}
                disabled={!canGoNext}
                className={cn(
                  'inline-flex items-center gap-2 px-6 py-2 rounded-lg',
                  'bg-primary text-primary-foreground font-medium',
                  'transition-all duration-200',
                  'hover:bg-primary/90',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={onExecuteMerge}
                disabled={isMerging}
                className={cn(
                  'inline-flex items-center gap-2 px-6 py-2 rounded-lg',
                  'bg-primary text-primary-foreground font-medium',
                  'transition-all duration-200',
                  'hover:bg-primary/90',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {isMerging ? (
                  <>
                    <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Merging...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Execute Merge
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Save Dashboard Dialog */}
      {mergeResult && selectedFileA && selectedFileB && (
        <SaveDashboardDialog
          open={showSaveDialog}
          onOpenChange={(open) => !open && onCloseSaveDialog()}
          onSave={onSaveDashboard}
          isSaving={isSavingDashboard}
          defaultName={`${selectedFileA.filename} + ${selectedFileB.filename} (${joinType})`}
          dashboardType="merged"
        />
      )}
    </div>
  )
}
