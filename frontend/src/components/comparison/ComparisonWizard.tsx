/**
 * ComparisonWizard - Multi-step file comparison wizard (Mockup 4)
 *
 * Features:
 * - Step 1: Select files to compare
 * - Step 2: Choose comparison type
 * - Step 3: Preview and execute
 */

import { useState } from 'react';
import { Wizard, WizardStep } from '../shared/Wizard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, TrendingUp, Calendar, GitCompare, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface File {
  id: number;
  filename: string;
  file_size: number;
  row_count?: number;
  uploaded_at: string;
}

interface ComparisonWizardProps {
  files: File[];
  onComplete: (fileAId: number, fileBId: number, comparisonType: string) => Promise<void>;
  onCancel: () => void;
}

const comparisonTypes = [
  {
    id: 'trend',
    name: 'Trend Analysis',
    description: 'Compare trends over time between datasets',
    icon: TrendingUp,
    recommended: true
  },
  {
    id: 'yoy',
    name: 'Year-over-Year',
    description: 'Compare same periods across different years',
    icon: Calendar,
    recommended: false
  },
  {
    id: 'side_by_side',
    name: 'Side-by-Side',
    description: 'Visual side-by-side comparison',
    icon: GitCompare,
    recommended: false
  }
];

export function ComparisonWizard({ files, onComplete, onCancel }: ComparisonWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedFileA, setSelectedFileA] = useState<number | null>(null);
  const [selectedFileB, setSelectedFileB] = useState<number | null>(null);
  const [comparisonType, setComparisonType] = useState<string>('trend');
  const [isProcessing, setIsProcessing] = useState(false);

  const formatFileSize = (bytes: number): string => {
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    if (selectedFileA && selectedFileB) {
      setIsProcessing(true);
      try {
        await onComplete(selectedFileA, selectedFileB, comparisonType);
      } catch (error) {
        console.error('Comparison failed:', error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // Step 1: Select Files
  const step1Content = (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-3">Select First File</h3>
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
        <h3 className="text-sm font-medium mb-3">Select Second File</h3>
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
  );

  // Step 2: Choose Comparison Type
  const step2Content = (
    <div className="space-y-4">
      {comparisonTypes.map((type) => {
        const Icon = type.icon;
        return (
          <button
            key={type.id}
            onClick={() => setComparisonType(type.id)}
            className={cn(
              'w-full p-4 rounded-lg border-2 text-left transition-all',
              'hover:border-primary hover:bg-accent/50',
              comparisonType === type.id && 'border-primary bg-accent'
            )}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 p-3 rounded-lg bg-primary/10">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium">{type.name}</p>
                  {type.recommended && (
                    <Badge variant="secondary" className="text-xs">Recommended</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{type.description}</p>
              </div>
              {comparisonType === type.id && (
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );

  // Step 3: Review and Execute
  const step3Content = (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comparison Summary</CardTitle>
          <CardDescription>Review your selections before proceeding</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">File A</p>
              <div className="p-3 rounded-lg border bg-card">
                <p className="text-sm font-medium truncate">
                  {files.find(f => f.id === selectedFileA)?.filename}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">File B</p>
              <div className="p-3 rounded-lg border bg-card">
                <p className="text-sm font-medium truncate">
                  {files.find(f => f.id === selectedFileB)?.filename}
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Comparison Type</p>
            <div className="p-3 rounded-lg border bg-card">
              <p className="text-sm font-medium">
                {comparisonTypes.find(t => t.id === comparisonType)?.name}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {comparisonTypes.find(t => t.id === comparisonType)?.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg bg-muted p-4">
        <p className="text-sm text-muted-foreground">
          Click "Compare Files" to generate overlay charts and AI-powered comparison insights.
          This may take a few moments.
        </p>
      </div>
    </div>
  );

  const steps: WizardStep[] = [
    {
      id: 'select-files',
      title: 'Select Files',
      description: 'Choose two files to compare',
      content: step1Content,
      validate: () => {
        if (!selectedFileA || !selectedFileB) {
          alert('Please select both files');
          return false;
        }
        return true;
      }
    },
    {
      id: 'comparison-type',
      title: 'Comparison Type',
      description: 'Choose how to compare the files',
      content: step2Content
    },
    {
      id: 'review',
      title: 'Review & Execute',
      description: 'Review your selections',
      content: step3Content
    }
  ];

  return (
    <Wizard
      steps={steps}
      currentStep={currentStep}
      onNext={handleNext}
      onPrevious={handlePrevious}
      onFinish={handleFinish}
      onCancel={onCancel}
      isLoading={isProcessing}
      finishButtonText="Compare Files"
    />
  );
}
