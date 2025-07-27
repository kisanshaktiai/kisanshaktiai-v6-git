
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { CompactWeatherCard } from '@/components/weather/CompactWeatherCard';
import { QuickSummaryTiles } from './dashboard/QuickSummaryTiles';
import { ProfessionalFeatureGrid } from './dashboard/ProfessionalFeatureGrid';
import { SeasonalCalendar } from './dashboard/SeasonalCalendar';
import { DynamicRecommendations } from './dashboard/DynamicRecommendations';
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
    }
  }, [tenantBranding]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLastRefresh(new Date());
    setIsRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-secondary/10">
      {/* Dynamic Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 pb-safe">
        {/* Pull-to-refresh indicator */}
        {isRefreshing && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-primary/90 backdrop-blur-md text-primary-foreground text-center py-2 animate-slide-down">
            <div className="flex items-center justify-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">{t('status.syncing')}</span>
            </div>
          </div>
        )}

        <div className="space-y-6 p-4 pt-6">
          {/* Welcome Section */}
          <div className="text-center space-y-2 animate-fade-in">
            <div className="text-sm text-muted-foreground font-medium tracking-wide uppercase">
              {t('welcome.subtitle')}
            </div>
          </div>

          {/* Weather Card - Priority placement */}
          <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <CompactWeatherCard />
          </div>
          
          {/* Quick Summary */}
          <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <QuickSummaryTiles />
          </div>

          {/* Feature Grid */}
          <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
            <ProfessionalFeatureGrid />
          </div>

          {/* Calendar */}
          <div className="animate-fade-in" style={{ animationDelay: '400ms' }}>
            <SeasonalCalendar />
          </div>

          {/* Recommendations */}
          <div className="animate-fade-in" style={{ animationDelay: '500ms' }}>
            <DynamicRecommendations />
          </div>

          {/* Spacer for bottom navigation */}
          <div className="h-4"></div>
        </div>
      </div>

      {/* Enhanced Footer */}
      <DashboardFooter lastRefresh={lastRefresh} />

      {/* Floating Action Button for Quick Actions */}
      <div className="fixed bottom-20 right-4 z-40">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="w-14 h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center backdrop-blur-sm border border-white/20 hover:scale-110 active:scale-95 disabled:opacity-50"
          aria-label={t('header.sync')}
        >
          <RefreshCw className={`w-6 h-6 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
};
