import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useUnifiedTenantData } from '@/hooks';
import { CompactWeatherCard } from '@/components/weather/CompactWeatherCard';
import { HorizontalQuickOverview } from './HorizontalQuickOverview';
import { CoreFeatureGrid } from './CoreFeatureGrid';
import { DashboardFooter } from './DashboardFooter';
import { applyTenantTheme } from '@/utils/tenantTheme';
import { RefreshCw } from 'lucide-react';

export const DashboardHome: React.FC = () => {
  const { t } = useTranslation('dashboard');
  const { currentTenant } = useSelector((state: RootState) => state.auth);
  const { branding } = useUnifiedTenantData(currentTenant);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Apply tenant theming
  useEffect(() => {
    if (branding) {
      applyTenantTheme(branding);
      
      const root = document.documentElement;
      root.style.setProperty('--tenant-primary', branding.primary_color || '#10b981');
      root.style.setProperty('--tenant-secondary', branding.secondary_color || '#059669');
      root.style.setProperty('--tenant-accent', branding.accent_color || '#34d399');
      
      root.style.setProperty(
        '--tenant-gradient-primary',
        `linear-gradient(135deg, ${branding.primary_color || '#10b981'}, ${branding.secondary_color || '#059669'})`
      );
    }
  }, [branding]);

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
        <div className="space-y-4 pb-6">
          {/* Compact Weather Card */}
          <div className="animate-fade-in px-4" style={{ animationDelay: '100ms' }}>
            <CompactWeatherCard />
          </div>
          
          {/* Quick Overview - smaller cards */}
          <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <HorizontalQuickOverview />
          </div>

          {/* Core Features Section */}
          <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
            <CoreFeatureGrid />
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
