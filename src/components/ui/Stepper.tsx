'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn('flex items-start w-full', className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;

        return (
          <div key={index} className="flex items-start flex-1 last:flex-none">
            {/* Step circle + label */}
            <div className="flex flex-col items-center text-center">
              <div
                className={cn(
                  'flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold transition-colors',
                  isCompleted && 'bg-green-500 text-white',
                  isActive &&
                    'bg-white border-2 border-brand-600 text-brand-700 ring-4 ring-brand-100',
                  !isCompleted &&
                    !isActive &&
                    'bg-surface-200 text-surface-500'
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>

              <span
                className={cn(
                  'mt-2 text-xs font-medium leading-tight max-w-[5rem]',
                  isCompleted && 'text-green-700',
                  isActive && 'text-brand-700',
                  !isCompleted && !isActive && 'text-surface-500'
                )}
              >
                {step.label}
              </span>

              {step.description && (
                <span className="mt-0.5 text-[10px] text-surface-400 max-w-[6rem] leading-tight">
                  {step.description}
                </span>
              )}
            </div>

            {/* Connecting line */}
            {index < steps.length - 1 && (
              <div className="flex-1 flex items-center px-2 mt-4">
                <div
                  className={cn(
                    'h-0.5 w-full rounded-full transition-colors',
                    index < currentStep ? 'bg-green-500' : 'bg-surface-200'
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
