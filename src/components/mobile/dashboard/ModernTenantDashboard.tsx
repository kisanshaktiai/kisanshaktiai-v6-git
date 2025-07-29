
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { useTenantData } from '@/hooks/useTenantData';
import { applyTenantTheme } from '@/utils/tenantTheme';
import { ModernTopBar } from './ModernTopBar';
import { TenantPromoBanner } from './TenantPromoBanner';
import { TenantWeatherCard } from './TenantWeatherCard';
import { SingleTaskRoller } from './SingleTaskRoller';
import { TenantQuickActions } from './TenantQuickActions';
import { TenantBottomNav } from './TenantBottomNav';

export const ModernTenantDashboard: React.FC = () => {
  const { tenantBranding, currentTenant, loading } = useSelector((state: RootState) => state.tenant);
  const { refreshTenant } = useTenantData();

  // Apply tenant theming only when branding changes
  useEffect(() => {
    if (tenantBranding) {
      applyTenantTheme(tenantBranding);
    }
  }, [tenantBranding]);

  if (loading) {
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
        <TenantWeatherCard />

        {/* Single Task Roller */}
        <SingleTaskRoller />

        {/* Quick Actions */}
        <TenantQuickActions />

        {/* Extra spacing for better UX */}
        <div className="h-6" />
      </main>

      {/* Bottom Navigation */}
      <TenantBottomNav />
    </div>
  );
};
