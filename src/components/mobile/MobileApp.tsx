
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useCustomAuth } from '@/hooks/useCustomAuth';

import { MobileLayout } from './MobileLayout';

// Import all page components - fix default imports
import { MobileHome } from '@/pages/mobile/MobileHome';
import { AiChat } from '@/pages/mobile/AiChat';
import Weather from '@/pages/mobile/Weather';
import { MyLands } from '@/pages/mobile/MyLands';
import { Market } from '@/pages/mobile/Market';
import { Profile } from '@/pages/mobile/Profile';
import { Analytics } from '@/pages/mobile/Analytics';
import { CropSchedule } from '@/pages/mobile/CropSchedule';
import { Community } from '@/pages/mobile/Community';
import SatelliteMonitoring from '@/pages/mobile/SatelliteMonitoring';

export const MobileApp: React.FC = () => {
  const { isAuthenticated } = useCustomAuth();

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <MobileLayout>
      <Routes>
        <Route index element={<MobileHome />} />
        <Route path="/ai-chat" element={<AiChat />} />
        <Route path="/weather" element={<Weather />} />
        <Route path="/my-lands" element={<MyLands />} />
        <Route path="/market" element={<Market />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/crop-schedule" element={<CropSchedule />} />
        <Route path="/community" element={<Community />} />
        <Route path="/satellite" element={<SatelliteMonitoring />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MobileLayout>
  );
};
