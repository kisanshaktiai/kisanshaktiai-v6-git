
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { CompactWeatherCard } from '@/components/weather/CompactWeatherCard';
import { HorizontalQuickOverview } from './dashboard/HorizontalQuickOverview';
import { CompactTaskCard } from './dashboard/CompactTaskCard';
import { CoreFeatureGrid } from './dashboard/CoreFeatureGrid';
import { DynamicRecommendations } from './dashboard/DynamicRecommendations';
import { DashboardFooter } from './dashboard/DashboardFooter';
import { applyTenantTheme } from '@/utils/tenantTheme';
import { RefreshCw } from 'lucide-react';

export const DashboardHome: React.FC = () => {
  const { t } = useTranslation('dashboard');
  const { tenantBranding } = useSelector((state: RootState) => state.tenant);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [timeBasedGreeting, setTimeBasedGreeting] = useState('');

  // Get time-based greeting
  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      let greeting = '';
      
      if (hour >= 5 && hour < 12) {
        greeting = t('welcome.goodMorning');
      } else if (hour >= 12 && hour < 17) {
        greeting = t('welcome.goodAfternoon');
      } else if (hour >= 17 && hour < 21) {
        greeting = t('welcome.goodEvening');
      } else {
        greeting = t('welcome.goodNight');
      }
      
      setTimeBasedGreeting(greeting);
    };

    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);
    
    return () => clearInterval(interval);
  }, [t]);

  // Apply tenant theming with enhanced CSS custom properties
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
      root.style.setProperty(
        '--tenant-gradient-accent',
        `linear-gradient(135deg, ${tenantBranding.accent_color || '#34d399'}, ${tenantBranding.primary_color || '#10b981'})`
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
      {/* Enhanced Dynamic Background Effects with Tenant Colors */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-60">
        <div 
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl animate-pulse"
          style={{ background: 'var(--tenant-gradient-primary, linear-gradient(135deg, #10b981, #059669))' }}
        ></div>
        <div 
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl animate-pulse" 
          style={{ 
            background: 'var(--tenant-gradient-accent, linear-gradient(135deg, #34d399, #10b981))',
            animationDelay: '2s' 
          }}
        ></div>
      </div>

      {/* Professional Pull-to-refresh indicator */}
      {isRefreshing && (
        <div className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-border/20 animate-slide-down">
          <div 
            className="text-white text-center py-3 shadow-lg"
            style={{ background: 'var(--tenant-gradient-primary, linear-gradient(135deg, #10b981, #059669))' }}
          >
            <div className="flex items-center justify-center space-x-3">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span className="text-sm font-semibold tracking-wide">{t('status.syncing')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content with New Layout */}
      <div className="relative z-10 pb-safe">
        <div className="space-y-6 pb-6">
          {/* Professional Welcome Section */}
          <div className="text-center space-y-3 animate-fade-in p-4">
            <div className="text-lg font-semibold text-foreground">
              {timeBasedGreeting}
            </div>
            <div className="inline-flex items-center px-4 py-2 bg-muted/50 backdrop-blur-sm rounded-full border border-border/50">
              <span className="text-sm text-muted-foreground font-medium tracking-wide uppercase">
                {t('welcome.subtitle')}
              </span>
            </div>
            <div className="text-xs text-muted-foreground font-medium">
              {t('status.lastUpdated')}: {lastRefresh.toLocaleTimeString()}
            </div>
          </div>

          {/* Weather Card - MOVED BELOW HEADER as requested */}
          <div className="animate-fade-in px-4" style={{ animationDelay: '100ms' }}>
            <CompactWeatherCard />
          </div>
          
          {/* Horizontal Quick Overview - Small cards in horizontal layout */}
          <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <HorizontalQuickOverview />
          </div>

          {/* Compact Task Cards - Small expandable cards */}
          <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
            <CompactTaskCard />
          </div>

          {/* Core Features Grid - Small rounded cards */}
          <div className="animate-fade-in" style={{ animationDelay: '400ms' }}>
            <CoreFeatureGrid />
          </div>

          {/* Smart Recommendations */}
          <div className="animate-fade-in px-4" style={{ animationDelay: '500ms' }}>
            <DynamicRecommendations />
          </div>

          {/* Safe area spacing for bottom navigation */}
          <div className="h-6"></div>
        </div>
      </div>

      {/* Enhanced Footer */}
      <DashboardFooter />

      {/* Professional Floating Action Button */}
      <div className="fixed bottom-24 right-6 z-40">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="group relative w-16 h-16 text-white rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center backdrop-blur-xl border border-white/10 hover:scale-110 active:scale-95 disabled:opacity-50 overflow-hidden"
          style={{ background: 'var(--tenant-gradient-primary, linear-gradient(135deg, #10b981, #059669))' }}
          aria-label={t('actions.refresh')}
        >
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <RefreshCw className={`w-7 h-7 z-10 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} />
          
          <div className="absolute inset-0 rounded-2xl opacity-0 group-active:animate-ping bg-white/20"></div>
        </button>
      </div>
    </div>
  );
};
