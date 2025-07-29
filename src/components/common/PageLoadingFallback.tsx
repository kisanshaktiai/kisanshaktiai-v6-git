import React from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';

interface PageLoadingFallbackProps {
  message?: string;
}

export const PageLoadingFallback: React.FC<PageLoadingFallbackProps> = ({ message }) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <div className="p-4 border-b border-border/20">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Content skeleton */}
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
        </div>
        
        <div className="space-y-3">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      </div>

      {/* Loading indicator */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="bg-card border border-border rounded-full px-4 py-2 shadow-lg flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
          <span className="text-sm text-muted-foreground">
            {message || t('common.loading', 'Loading...')}
          </span>
        </div>
      </div>

      {/* Bottom navigation skeleton */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border/20 p-2">
        <div className="flex justify-around">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center space-y-1">
              <Skeleton className="h-6 w-6 rounded" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};