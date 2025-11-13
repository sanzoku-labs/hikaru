/**
 * Wizard - Generic multi-step wizard component
 *
 * Features:
 * - Step-based navigation
 * - Progress indicator
 * - Validation per step
 * - Next/Previous/Finish actions
 * - Customizable step content
 */

import React, { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  content: ReactNode;
  validate?: () => boolean | Promise<boolean>;
}

interface WizardProps {
  steps: WizardStep[];
  currentStep: number;
  onNext: () => void;
  onPrevious: () => void;
  onFinish: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
  finishButtonText?: string;
  className?: string;
}

export function Wizard({
  steps,
  currentStep,
  onNext,
  onPrevious,
  onFinish,
  onCancel,
  isLoading = false,
  finishButtonText = 'Finish',
  className
}: WizardProps) {
  const current = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  const handleNext = async () => {
    if (current.validate) {
      const isValid = await current.validate();
      if (!isValid) return;
    }
    onNext();
  };

  const handleFinish = async () => {
    if (current.validate) {
      const isValid = await current.validate();
      if (!isValid) return;
    }
    onFinish();
  };

  return (
    <div className={cn('w-full max-w-3xl mx-auto', className)}>
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              {/* Step Circle */}
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all',
                    index < currentStep && 'bg-primary border-primary text-primary-foreground',
                    index === currentStep && 'border-primary text-primary',
                    index > currentStep && 'border-muted text-muted-foreground'
                  )}
                >
                  {index < currentStep ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      'text-xs font-medium',
                      index === currentStep ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {step.title}
                  </p>
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <Separator
                  className={cn(
                    'flex-1 mx-2 h-0.5 -mt-6',
                    index < currentStep ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{current.title}</CardTitle>
          {current.description && (
            <CardDescription>{current.description}</CardDescription>
          )}
        </CardHeader>

        <CardContent className="min-h-[300px]">
          {current.content}
        </CardContent>

        <CardFooter className="flex justify-between">
          <div>
            {onCancel && (
              <Button
                variant="ghost"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {!isFirst && (
              <Button
                variant="outline"
                onClick={onPrevious}
                disabled={isLoading}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            )}

            {!isLast && (
              <Button
                onClick={handleNext}
                disabled={isLoading}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}

            {isLast && (
              <Button
                onClick={handleFinish}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : finishButtonText}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Step Indicator */}
      <div className="mt-4 text-center text-sm text-muted-foreground">
        Step {currentStep + 1} of {steps.length}
      </div>
    </div>
  );
}
