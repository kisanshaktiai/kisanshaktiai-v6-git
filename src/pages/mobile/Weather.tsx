
import React from 'react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { WeatherDashboard } from '@/components/weather/WeatherDashboard';

export default function Weather() {
  return (
    <MobileLayout showHeader={false}>
      <WeatherDashboard />
    </MobileLayout>
  );
}
