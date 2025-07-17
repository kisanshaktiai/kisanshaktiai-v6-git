import React from 'react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import SatelliteMonitoring from '@/components/satellite/SatelliteMonitoring';

const SatelliteMonitoringPage: React.FC = () => {
  return (
    <MobileLayout>
      <div className="p-4">
        <SatelliteMonitoring />
      </div>
    </MobileLayout>
  );
};

export default SatelliteMonitoringPage;