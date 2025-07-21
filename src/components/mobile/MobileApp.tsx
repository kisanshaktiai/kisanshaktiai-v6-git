
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { MobileLayout } from './MobileLayout';
import { MobileHome } from '@/pages/mobile/MobileHome';
import { AiChat } from '@/pages/mobile/AiChat';
import Weather from '@/pages/mobile/Weather';
import { MyLands } from '@/pages/mobile/MyLands';
import { Market } from '@/pages/mobile/Market';
import { Analytics } from '@/pages/mobile/Analytics';
import { Profile } from '@/pages/mobile/Profile';
import { Community } from '@/pages/mobile/Community';
import { CropSchedule } from '@/pages/mobile/CropSchedule';
import SatelliteMonitoring from '@/pages/mobile/SatelliteMonitoring';

export const MobileApp: React.FC = () => {
  return (
    <MobileLayout>
      <Routes>
        <Route path="/" element={<MobileHome />} />
        <Route path="/chat" element={<AiChat />} />
        <Route path="/weather" element={<Weather />} />
        <Route path="/lands" element={<MyLands />} />
        <Route path="/market" element={<Market />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/community" element={<Community />} />
        <Route path="/schedule" element={<CropSchedule />} />
        <Route path="/satellite" element={<SatelliteMonitoring />} />
      </Routes>
    </MobileLayout>
  );
};
