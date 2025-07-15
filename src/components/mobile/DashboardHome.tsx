
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { QuickSummaryTiles } from './dashboard/QuickSummaryTiles';
import { FeatureGrid } from './dashboard/FeatureGrid';
import { DynamicRecommendations } from './dashboard/DynamicRecommendations';
import { SeasonalCalendar } from './dashboard/SeasonalCalendar';
import { DashboardFooter } from './dashboard/DashboardFooter';

export const DashboardHome: React.FC = () => {
  const { t } = useTranslation();
  const { isOnline } = useSelector((state: RootState) => state.sync);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Section */}
      <DashboardHeader />

      {/* Main Content */}
      <div className="space-y-6">
        {/* Quick Summary Tiles */}
        <QuickSummaryTiles />

        {/* Primary Feature Grid */}
        <FeatureGrid />

        {/* Dynamic Recommendations */}
        <DynamicRecommendations />

        {/* Seasonal Calendar Widget */}
        <SeasonalCalendar />

        {/* Offline Indicator */}
        {!isOnline && (
          <div className="mx-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <p className="text-sm text-yellow-800">
                {t('offline.workingOffline', 'Working offline - Data will sync when connected')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <DashboardFooter />
    </div>
  );
};
