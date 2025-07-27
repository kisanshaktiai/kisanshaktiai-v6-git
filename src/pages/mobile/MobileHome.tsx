import React from 'react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { QuickSummaryTiles } from '@/components/mobile/dashboard/QuickSummaryTiles';
import { SeasonalCalendar } from '@/components/mobile/dashboard/SeasonalCalendar';
import { ProfessionalFeatureGrid } from '@/components/mobile/dashboard/ProfessionalFeatureGrid';
import { DynamicRecommendations } from '@/components/mobile/dashboard/DynamicRecommendations';
import { WeatherDebugPanel } from '@/components/mobile/dashboard/WeatherDebugPanel';

interface MobileHomeProps {
  // You can define props for this component if needed
}

export default function MobileHome() {
  return (
    <MobileLayout>
      <div className="space-y-4">
        <QuickSummaryTiles />
        <SeasonalCalendar />
        <ProfessionalFeatureGrid />
        <DynamicRecommendations />
        
        {/* Weather Debug Panel - only in development */}
        {process.env.NODE_ENV === 'development' && (
          <WeatherDebugPanel />
        )}
      </div>
    </MobileLayout>
  );
}
