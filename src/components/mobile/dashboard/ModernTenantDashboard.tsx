
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { useUnifiedTenantData } from '@/hooks/useUnifiedTenantData';
import { applyTenantTheme } from '@/utils/tenantTheme';
import { TenantErrorBoundary } from '@/components/error-boundaries/TenantErrorBoundary';
import { QueryErrorBoundary } from '@/components/error-boundaries/QueryErrorBoundary';
import { ModernTopBar } from './ModernTopBar';
import { TenantPromoBanner } from './TenantPromoBanner';
import { TenantWeatherCard } from './TenantWeatherCard';
import { SingleTaskRoller } from './SingleTaskRoller';
import { TenantQuickActions } from './TenantQuickActions';
import { TenantBottomNav } from './TenantBottomNav';

export const ModernTenantDashboard: React.FC = () => {
  const { currentTenant } = useSelector((state: RootState) => state.tenant);
  const { 
    tenant, 
    branding, 
    features, 
    isLoading, 
    isError, 
    error 
  } = useUnifiedTenantData(currentTenant?.id);

  // Apply tenant theming only when branding changes
  useEffect(() => {
    if (branding) {
      applyTenantTheme(branding);
    }
  }, [branding]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <TenantErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Dashboard error:', error, errorInfo);
      }}
    >
      <QueryErrorBoundary 
        level="page" 
        context="tenant dashboard"
        onRetry={() => window.location.reload()}
      >
        <div className="min-h-screen bg-background">
          {/* Top Bar */}
          <ModernTopBar />

          {/* Main Content */}
          <main className="pb-24">
            {/* Promotional Banner */}
            <div className="pt-4">
              <TenantPromoBanner />
            </div>

            {/* Weather Card */}
            <QueryErrorBoundary level="component" context="weather data">
              <TenantWeatherCard />
            </QueryErrorBoundary>

            {/* Single Task Roller */}
            <QueryErrorBoundary level="component" context="task data">
              <SingleTaskRoller />
            </QueryErrorBoundary>

            {/* Quick Actions */}
            <QueryErrorBoundary level="component" context="quick actions">
              <TenantQuickActions />
            </QueryErrorBoundary>

            {/* Extra spacing for better UX */}
            <div className="h-6" />
          </main>

          {/* Bottom Navigation */}
          <TenantBottomNav />
        </div>
      </QueryErrorBoundary>
    </TenantErrorBoundary>
  );
};
