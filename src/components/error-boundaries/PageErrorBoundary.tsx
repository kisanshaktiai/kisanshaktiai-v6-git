
import React, { ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BaseErrorBoundary } from './BaseErrorBoundary';

interface Props {
  children: ReactNode;
  pageName?: string;
  onError?: (error: Error) => void;
}

export const PageErrorBoundary: React.FC<Props> = ({ 
  children, 
  pageName,
  onError 
}) => {
  const renderPageError = (error: Error | null, onRetry: () => void) => (
    <div className="min-h-[50vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
          <CardTitle className="text-lg">
            Failed to load {pageName || 'page'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-muted-foreground text-sm">
            <p>{error?.message || 'An unexpected error occurred while loading this page.'}</p>
          </div>
          
          <div className="flex flex-col space-y-2">
            <Button onClick={onRetry} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            
            <Button 
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="w-full"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <BaseErrorBoundary
      fallback={null}
      onError={(error, errorInfo) => {
        console.error(`Page error in ${pageName || 'Unknown'}:`, error, errorInfo);
        onError?.(error);
      }}
    >
      {({ hasError, error, onRetry }) => 
        hasError ? renderPageError(error, onRetry) : children
      }
    </BaseErrorBoundary>
  );
};
