
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { CompactWeatherCard } from '@/components/weather/CompactWeatherCard';
import { HorizontalQuickOverview } from './dashboard/HorizontalQuickOverview';
import { FieldManagementSection } from './dashboard/FieldManagementSection';
import { DashboardFooter } from './dashboard/DashboardFooter';
import { applyTenantTheme } from '@/utils/tenantTheme';
import { RefreshCw } from 'lucide-react';

export const DashboardHome: React.FC = () => {
  const { t } = useTranslation('dashboard');
  const { tenantBranding } = useSelector((state: RootState) => state.tenant);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Apply tenant theming
  useEffect(() => {
    if (tenantBranding) {
      applyTenantTheme(tenantBranding);
      
      const root = document.documentElement;
      root.style.setProperty('--tenant-primary', tenantBranding.primary_color || '#10b981');
      root.style.setProperty('--tenant-secondary', tenantBranding.secondary_color || '#059669');
      root.style.setProperty('--tenant-accent', tenantBranding.accent_color || '#34d399');
      
      root.style.setProperty(
        '--tenant-gradient-primary',
        `linear-gradient(135deg, ${tenantBranding.primary_color || '#10b981'}, ${tenantBranding.secondary_color || '#059669'})`
      );
    }
  }, [tenantBranding]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    setLastRefresh(new Date());
    setIsRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/30 relative overflow-hidden">
      {/* Dynamic Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
        <div 
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl animate-pulse"
          style={{ background: 'var(--tenant-gradient-primary, linear-gradient(135deg, #10b981, #059669))' }}
        ></div>
        <div 
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl animate-pulse" 
          style={{ 
            background: 'var(--tenant-gradient-primary, linear-gradient(135deg, #10b981, #059669))',
            animationDelay: '2s' 
          }}
        ></div>
      </div>

      {/* Pull-to-refresh indicator */}
      {isRefreshing && (
        <div className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-border/20">
          <div 
            className="text-white text-center py-3 shadow-lg"
            style={{ background: 'var(--tenant-gradient-primary, linear-gradient(135deg, #10b981, #059669))' }}
          >
            <div className="flex items-center justify-center space-x-3">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span className="text-sm font-semibold">{t('status.syncing')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 pb-safe">
        <div className="space-y-6 pb-6">
          {/* Weather Card - positioned below header */}
          <div className="animate-fade-in px-4" style={{ animationDelay: '100ms' }}>
            <CompactWeatherCard />
          </div>
          
          {/* Quick Overview - horizontal layout */}
          <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <HorizontalQuickOverview />
          </div>

          {/* Field Management Section */}
          <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
            <FieldManagementSection />
          </div>

          {/* Safe area spacing for bottom navigation */}
          <div className="h-6"></div>
        </div>
      </div>

      {/* Footer */}
      <DashboardFooter />

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-6 z-40">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="group relative w-16 h-16 text-white rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center backdrop-blur-xl border border-white/10 hover:scale-110 active:scale-95 disabled:opacity-50 overflow-hidden"
          style={{ background: 'var(--tenant-gradient-primary, linear-gradient(135deg, #10b981, #059669))' }}
          aria-label={t('actions.refresh')}
        >
          <RefreshCw className={`w-7 h-7 z-10 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} />
        </button>
      </div>
    </div>
  );
};
