
import React from 'react';
import { useTranslation } from 'react-i18next';
import { QuickSummaryTiles } from './dashboard/QuickSummaryTiles';
import { FeatureGrid } from './dashboard/FeatureGrid';
import { SeasonalCalendar } from './dashboard/SeasonalCalendar';
import { DynamicRecommendations } from './dashboard/DynamicRecommendations';
import { DashboardFooter } from './dashboard/DashboardFooter';

export const DashboardHome: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="pb-20 min-h-screen bg-gradient-to-br from-green-50/30 via-blue-50/20 to-yellow-50/10">
      {/* Main Dashboard Content */}
      <div className="space-y-6 p-4">
        <QuickSummaryTiles />
        <FeatureGrid />
        <SeasonalCalendar />
        <DynamicRecommendations />
      </div>
      
      <DashboardFooter />
    </div>
  );
};
