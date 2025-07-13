import React, { useEffect, useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isActive || !steps[currentStep]) return;

    const element = document.querySelector(steps[currentStep].target) as HTMLElement;
    setTargetElement(element);

    if (element) {
      element.style.position = 'relative';
      element.style.zIndex = '1000';
      element.classList.add('onboarding-highlight');
      
      // Scroll to element on mobile avec un délai pour laisser le temps au DOM de se mettre à jour
      if (isMobile) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }

    return () => {
      if (element) {
        element.style.position = '';
        element.style.zIndex = '';
        element.classList.remove('onboarding-highlight');
      }
    };
  }, [currentStep, isActive, steps, isMobile]);

  // Empêcher le scroll du body pendant l'onboarding
  useEffect(() => {
    if (isActive) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isActive]);

  if (!isActive || !steps[currentStep] || !targetElement) return null;

  const step = steps[currentStep];
  const rect = targetElement.getBoundingClientRect();
  
  const getTooltipPosition = () => {
    const base = {
      position: 'fixed' as const,
      zIndex: 1001,
    };

    if (isMobile) {
      // Sur mobile, toujours positionner en bas avec une marge de sécurité
      return {
        ...base,
        bottom: '20px',
        left: '16px',
        right: '16px',
        width: 'calc(100vw - 32px)',
        maxWidth: 'none',
      };
    }

    // Sur desktop, utiliser la position demandée
    const tooltipWidth = 300;
    const tooltipHeight = 150; // Estimation approximative
    const padding = 10;

    switch (step.position) {
      case 'top':
        return {
          ...base,
          bottom: window.innerHeight - rect.top + padding,
          left: Math.max(padding, Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding)),
          width: tooltipWidth,
        };
      case 'bottom':
        return {
          ...base,
          top: rect.bottom + padding,
          left: Math.max(padding, Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding)),
          width: tooltipWidth,
        };
      case 'left':
        return {
          ...base,
          right: window.innerWidth - rect.left + padding,
          top: Math.max(padding, Math.min(rect.top + rect.height / 2 - tooltipHeight / 2, window.innerHeight - tooltipHeight - padding)),
          width: tooltipWidth,
        };
      case 'right':
        return {
          ...base,
          left: rect.right + padding,
          top: Math.max(padding, Math.min(rect.top + rect.height / 2 - tooltipHeight / 2, window.innerHeight - tooltipHeight - padding)),
          width: tooltipWidth,
        };
      default:
        return {
          ...base,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: tooltipWidth,
        };
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  return (
    <>
      {/* Overlay - avec un z-index plus élevé */}
      <div 
        className="fixed inset-0 bg-black/50 z-[999]" 
        onClick={handleSkip}
      />
      
      {/* Spotlight effect pour mettre en évidence l'élément ciblé */}
      {!isMobile && (
        <div
          className="fixed pointer-events-none z-[1000]"
          style={{
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
            borderRadius: '8px',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
            border: '2px solid rgb(var(--primary))',
          }}
        />
      )}
      
      {/* Tooltip */}
      <div 
        style={getTooltipPosition()}
        className="bg-background border border-border rounded-lg p-4 shadow-xl animate-scale-in z-[1001]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-sm pr-2 flex-1">{step.title}</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 -mt-1 -mr-1 flex-shrink-0 hover:bg-muted"
            onClick={handleSkip}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          {step.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                  index === currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSkip}
              className="text-muted-foreground hover:text-foreground"
            >
              Passer
            </Button>
            <Button 
              size="sm" 
              onClick={handleNext} 
              className="bg-primary hover:bg-primary/90 shadow-sm"
            >
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