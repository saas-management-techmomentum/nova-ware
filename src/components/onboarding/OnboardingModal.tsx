
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, SkipForward } from 'lucide-react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { cn } from '@/lib/utils';

export const OnboardingModal: React.FC = () => {
  const {
    isOnboardingActive,
    currentStep,
    steps,
    nextStep,
    previousStep,
    skipOnboarding,
    completeOnboarding,
  } = useOnboarding();

  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [highlightPosition, setHighlightPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });

  const currentStepData = steps.find(step => step.id === currentStep);
  const isLastStep = currentStep === steps.length;

  // Find and highlight target element
  useEffect(() => {
    if (!isOnboardingActive || !currentStepData?.target) {
      setTargetElement(null);
      return;
    }

    const element = document.querySelector(currentStepData.target) as HTMLElement;
    if (element) {
      setTargetElement(element);
      const rect = element.getBoundingClientRect();
      setHighlightPosition({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });

      // Scroll element into view
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'center'
      });
    }
  }, [isOnboardingActive, currentStep, currentStepData]);

  if (!isOnboardingActive || !currentStepData) {
    return null;
  }

  const getModalPosition = () => {
    if (!targetElement || !currentStepData.target) {
      return {
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const { position = 'bottom' } = currentStepData;
    const offset = 20;

    switch (position) {
      case 'top':
        return {
          position: 'fixed' as const,
          top: highlightPosition.top - offset,
          left: highlightPosition.left + highlightPosition.width / 2,
          transform: 'translate(-50%, -100%)',
        };
      case 'bottom':
        return {
          position: 'fixed' as const,
          top: highlightPosition.top + highlightPosition.height + offset,
          left: highlightPosition.left + highlightPosition.width / 2,
          transform: 'translate(-50%, 0)',
        };
      case 'left':
        return {
          position: 'fixed' as const,
          top: highlightPosition.top + highlightPosition.height / 2,
          left: highlightPosition.left - offset,
          transform: 'translate(-100%, -50%)',
        };
      case 'right':
        return {
          position: 'fixed' as const,
          top: highlightPosition.top + highlightPosition.height / 2,
          left: highlightPosition.left + highlightPosition.width + offset,
          transform: 'translate(0, -50%)',
        };
      default:
        return {
          position: 'fixed' as const,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
    }
  };

  return (
    <>
      {/* Backdrop without blur */}
      <div className="fixed inset-0 bg-black/50 z-50" />
      
      {/* Highlight overlay for target element */}
      {targetElement && (
        <div
          className="fixed z-[60] pointer-events-none"
          style={{
            top: highlightPosition.top - 4,
            left: highlightPosition.left - 4,
            width: highlightPosition.width + 8,
            height: highlightPosition.height + 8,
            border: '2px solid hsl(var(--primary))',
            borderRadius: '8px',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
          }}
        />
      )}

      {/* Onboarding Modal */}
      <div
        className="fixed z-[70] max-w-sm w-full mx-4"
        style={getModalPosition()}
      >
        <div className="bg-background border border-border rounded-lg shadow-lg p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      index + 1 <= currentStep 
                        ? "bg-primary" 
                        : "bg-muted"
                    )}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {currentStep} of {steps.length}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={skipOnboarding}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-foreground">
              {currentStepData.title}
            </h3>
            <p className="text-muted-foreground">
              {currentStepData.content}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={previousStep}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={skipOnboarding}
              >
                <SkipForward className="h-4 w-4 mr-1" />
                Skip All
              </Button>
            </div>

            <Button
              size="sm"
              onClick={isLastStep ? completeOnboarding : nextStep}
            >
              {isLastStep ? 'Complete' : 'Next'}
              {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
