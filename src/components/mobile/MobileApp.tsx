
import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '@/hooks/useAuth';
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
  const { loading: authLoading, isAuthenticated: contextIsAuthenticated } = useAuth();
  const { isAuthenticated: reduxIsAuthenticated, onboardingCompleted } = useSelector((state: RootState) => state.auth);

  // Use the most reliable source of authentication state
  const isAuthenticated = contextIsAuthenticated || reduxIsAuthenticated;

  useEffect(() => {
    // Initialize mobile services only once
    const initializeApp = async () => {
      try {
        await LanguageService.getInstance().initialize();
        await SyncService.getInstance().initialize();
      } catch (error) {
        console.error('Failed to initialize services:', error);
      }
    };

    initializeApp();
  }, []);

  // Show loading while auth is being determined
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show onboarding if user is not authenticated or hasn't completed onboarding
  if (!isAuthenticated || !onboardingCompleted) {
    return <OnboardingFlow />;
  }

  // User is authenticated and onboarded, show main app
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
