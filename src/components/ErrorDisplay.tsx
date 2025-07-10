
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  message, 
  className = "" 
}) => {
  return (
    <div className={`flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive ${className}`}>
      <AlertCircle className="w-4 h-4 shrink-0" />
      <span className="text-sm flex-1">{message}</span>
    </div>
  );
};
