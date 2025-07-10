import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  message, 
  onRetry, 
  className = "" 
}) => {
  return (
    <div className={`flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive ${className}`}>
      <AlertCircle className="w-4 h-4 shrink-0" />
      <span className="text-sm flex-1">{message}</span>
      {onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className="h-6 px-2 text-destructive hover:bg-destructive/20"
        >
          <RefreshCw className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
};