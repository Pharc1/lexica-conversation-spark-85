import React, { useEffect, useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnboardingStep {
  id: string;
  target: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingTooltipProps {
  steps: OnboardingStep[];
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export const OnboardingTooltip: React.FC<OnboardingTooltipProps> = ({
  steps,
  isActive,
  onComplete,
  onSkip
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !steps[currentStep]) return;

    const element = document.querySelector(steps[currentStep].target) as HTMLElement;
    setTargetElement(element);

    if (element) {
      element.style.position = 'relative';
      element.style.zIndex = '1000';
      element.classList.add('onboarding-highlight');
    }

    return () => {
      if (element) {
        element.style.position = '';
        element.style.zIndex = '';
        element.classList.remove('onboarding-highlight');
      }
    };
  }, [currentStep, isActive, steps]);

  if (!isActive || !steps[currentStep] || !targetElement) return null;

  const step = steps[currentStep];
  const rect = targetElement.getBoundingClientRect();
  
  const getTooltipPosition = () => {
    const base = {
      position: 'fixed' as const,
      zIndex: 1001,
      maxWidth: '300px',
    };

    switch (step.position) {
      case 'top':
        return {
          ...base,
          bottom: window.innerHeight - rect.top + 10,
          left: rect.left + rect.width / 2,
          transform: 'translateX(-50%)',
        };
      case 'bottom':
        return {
          ...base,
          top: rect.bottom + 10,
          left: rect.left + rect.width / 2,
          transform: 'translateX(-50%)',
        };
      case 'left':
        return {
          ...base,
          right: window.innerWidth - rect.left + 10,
          top: rect.top + rect.height / 2,
          transform: 'translateY(-50%)',
        };
      case 'right':
        return {
          ...base,
          left: rect.right + 10,
          top: rect.top + rect.height / 2,
          transform: 'translateY(-50%)',
        };
      default:
        return base;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-999" />
      
      {/* Tooltip */}
      <div 
        style={getTooltipPosition()}
        className="bg-background border border-border rounded-lg p-4 shadow-lg animate-scale-in"
      >
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-sm">{step.title}</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 -mt-1 -mr-1"
            onClick={onSkip}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">{step.description}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onSkip}>
              Passer
            </Button>
            <Button size="sm" onClick={handleNext}>
              {currentStep < steps.length - 1 ? (
                <>
                  Suivant
                  <ArrowRight className="w-3 h-3 ml-1" />
                </>
              ) : (
                'Terminer'
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};