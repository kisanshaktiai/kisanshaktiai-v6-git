
import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { LocationService } from '@/services/LocationService';
import { LanguageService } from '@/services/LanguageService';
import { SyncService } from '@/services/SyncService';
import { MobileLayout } from './MobileLayout';
import { OnboardingFlow } from '../onboarding/OnboardingFlow';
import { DashboardHome } from './DashboardHome';
import { MyLands } from '@/pages/mobile/MyLands';
import { AiChat } from '@/pages/mobile/AiChat';
import { CropSchedule } from '@/pages/mobile/CropSchedule';
import { Market } from '@/pages/mobile/Market';
import { Community } from '@/pages/mobile/Community';
import { Profile } from '@/pages/mobile/Profile';

export const MobileApp: React.FC = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, onboardingCompleted } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Initialize mobile services
    const initializeApp = async () => {
      await LanguageService.getInstance().initialize();
      await SyncService.getInstance().initialize();
    };

    initializeApp();
  }, []);

  // Show onboarding if user is not authenticated or hasn't completed onboarding
  if (!isAuthenticated || !onboardingCompleted) {
    return <OnboardingFlow />;
  }

  return (
    <MobileLayout>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/my-lands" element={<MyLands />} />
        <Route path="/ai-chat" element={<AiChat />} />
        <Route path="/crop-schedule" element={<CropSchedule />} />
        <Route path="/market" element={<Market />} />
        <Route path="/community" element={<Community />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<DashboardHome />} />
      </Routes>
    </MobileLayout>
  );
};
