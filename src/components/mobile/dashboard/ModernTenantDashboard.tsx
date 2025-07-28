
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { useTenantData } from '@/hooks/useTenantData';
import { createTenantTheme, applyTenantTheme } from '@/utils/multiTenantTheme';
import { ModernTopBar } from './ModernTopBar';
import { TenantPromoBanner } from './TenantPromoBanner';
import { TenantWeatherCard } from './TenantWeatherCard';
import { SingleTaskRoller } from './SingleTaskRoller';
import { TenantQuickActions } from './TenantQuickActions';
import { TenantBottomNav } from './TenantBottomNav';

export const ModernTenantDashboard: React.FC = () => {
  const { tenantBranding, currentTenant, loading } = useSelector((state: RootState) => state.tenant);
  const { refreshTenant } = useTenantData();

  // Apply tenant theming
  useEffect(() => {
    if (tenantBranding) {
      const theme = createTenantTheme({
        logoUrl: tenantBranding.logo_url,
        appName: tenantBranding.app_name,
        primaryColor: tenantBranding.primary_color,
        secondaryColor: tenantBranding.secondary_color,
        accentColor: tenantBranding.accent_color,
        backgroundColor: tenantBranding.background_color,
        textColor: tenantBranding.text_color
      });
      
      applyTenantTheme(theme);
    }
  }, [tenantBranding]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
