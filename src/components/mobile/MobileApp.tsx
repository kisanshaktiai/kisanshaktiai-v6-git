
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { MobileLayout } from './MobileLayout';
import { DashboardHome } from './DashboardHome';
import { MyLands } from '@/pages/mobile/MyLands';
import { AiChat } from '@/pages/mobile/AiChat';
import { CropSchedule } from '@/pages/mobile/CropSchedule';
import { Market } from '@/pages/mobile/Market';
import { Analytics } from '@/pages/mobile/Analytics';
import { Community } from '@/pages/mobile/Community';
import { Profile } from '@/pages/mobile/Profile';

export const MobileApp: React.FC = () => {
  return (
    <MobileLayout>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/my-lands" element={<MyLands />} />
        <Route path="/ai-chat" element={<AiChat />} />
        <Route path="/crop-schedule" element={<CropSchedule />} />
        <Route path="/market" element={<Market />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/community" element={<Community />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<DashboardHome />} />
      </Routes>
    </MobileLayout>
  );
};
