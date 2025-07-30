
import React, { ReactNode } from 'react';
import { BaseErrorBoundary } from './BaseErrorBoundary';

interface Props {
  children: ReactNode;
  componentName?: string;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
}

export const ComponentErrorBoundary: React.FC<Props> = ({ 
  children, 
  componentName,
  fallback,
  onError 
}) => {
  return (
    <BaseErrorBoundary
      fallback={fallback}
      onError={(error, errorInfo) => {
        console.error(`Component error in ${componentName || 'Unknown'}:`, error, errorInfo);
        onError?.(error);
      }}
      onRetry={() => {
        console.log(`Retrying component: ${componentName || 'Unknown'}`);
      }}
    >
      {children}
    </BaseErrorBoundary>
  );
};
