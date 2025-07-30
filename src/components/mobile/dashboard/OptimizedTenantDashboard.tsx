
import React, { memo, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useUnifiedTenantData } from '@/hooks';
import { UnifiedErrorBoundary } from '@/components/error-boundaries/UnifiedErrorBoundary';
import { applyTenantTheme } from '@/utils';
import { withMemoization } from '@/components/common/MemoizedComponent';

// Memoized sub-components
const MemoizedTopBar = memo(() => {
  const { ModernTopBar } = require('./ModernTopBar');
  return <ModernTopBar />;
});

const MemoizedPromoBanner = memo(() => {
  const { TenantPromoBanner } = require('./TenantPromoBanner');
  return <TenantPromoBanner />;
});

const MemoizedWeatherCard = memo(() => {
  const { TenantWeatherCard } = require('./TenantWeatherCard');
  return <TenantWeatherCard />;
});

const MemoizedTaskRoller = memo(() => {
  const { SingleTaskRoller } = require('./SingleTaskRoller');
  return <SingleTaskRoller />;
});

const MemoizedQuickActions = memo(() => {
  const { TenantQuickActions } = require('./TenantQuickActions');
  return <TenantQuickActions />;
});

const MemoizedBottomNav = memo(() => {
  const { TenantBottomNav } = require('./TenantBottomNav');
  return <TenantBottomNav />;
});

interface OptimizedTenantDashboardProps {
  className?: string;
}

const OptimizedTenantDashboard: React.FC<OptimizedTenantDashboardProps> = memo(({ className }) => {
  const { currentTenant } = useSelector((state: RootState) => state.auth);
  const { 
    tenant, 
    branding, 
    features, 
    isLoading, 
    isError 
  } = useUnifiedTenantData(currentTenant);

  // Memoize theme application to prevent unnecessary re-renders
  useMemo(() => {
    if (branding) {
      applyTenantTheme(branding);
    }
  }, [branding?.version, branding?.updated_at]);

  // Memoize loading state to prevent flicker
  const loadingComponent = useMemo(() => (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground">Loading dashboard...</p>
      </div>
    </div>
  ), []);

  if (isLoading) {
    return loadingComponent;
  }

  return (
    <UnifiedErrorBoundary 
      level="page" 
      context="optimized-tenant-dashboard"
      maxRetries={3}
    >
      <div className={`min-h-screen bg-background ${className || ''}`}>
        {/* Top Bar */}
        <MemoizedTopBar />

        {/* Main Content */}
        <main className="pb-24">
          {/* Promotional Banner */}
          <div className="pt-4">
            <UnifiedErrorBoundary level="component" context="promo-banner">
              <MemoizedPromoBanner />
            </UnifiedErrorBoundary>
          </div>

          {/* Weather Card */}
          <UnifiedErrorBoundary level="component" context="weather-card">
            <MemoizedWeatherCard />
          </UnifiedErrorBoundary>

          {/* Single Task Roller */}
          <UnifiedErrorBoundary level="component" context="task-roller">
            <MemoizedTaskRoller />
          </UnifiedErrorBoundary>

          {/* Quick Actions */}
          <UnifiedErrorBoundary level="component" context="quick-actions">
            <MemoizedQuickActions />
          </UnifiedErrorBoundary>

          {/* Extra spacing for better UX */}
          <div className="h-6" />
        </main>

        {/* Bottom Navigation */}
        <MemoizedBottomNav />
      </div>
    </UnifiedErrorBoundary>
  );
});

OptimizedTenantDashboard.displayName = 'OptimizedTenantDashboard';

export { OptimizedTenantDashboard };
