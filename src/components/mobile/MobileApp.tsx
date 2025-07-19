
import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { RootState } from '@/store';
import { LanguageService } from '@/services/LanguageService';
import { SyncService } from '@/services/SyncService';
import { PhoneAuthScreen } from '@/components/auth/PhoneAuthScreen';
import { setOnboardingCompleted } from '@/store/slices/authSlice';
import { tenantService } from '@/services/TenantService';
import { DEFAULT_TENANT_ID } from '@/config/constants';

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
  const dispatch = useDispatch();
  const { loading: authLoading, isAuthenticated } = useCustomAuth();
  const { onboardingCompleted } = useSelector((state: RootState) => state.auth);
  const [appInitialized, setAppInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize mobile services
    const initializeApp = async () => {
      try {
        console.log('Starting app initialization...');
        
        // Initialize tenant service first
        console.log('Setting default tenant ID:', DEFAULT_TENANT_ID);
        tenantService.setCurrentTenantId(DEFAULT_TENANT_ID);
        
        // Initialize services in parallel for better performance
        await Promise.allSettled([
          LanguageService.getInstance().initialize(),
          SyncService.getInstance().initialize()
        ]);
        
        // Apply saved language if available
        const savedLanguage = localStorage.getItem('selectedLanguage');
        if (savedLanguage) {
          try {
            await LanguageService.getInstance().changeLanguage(savedLanguage);
            console.log('Applied saved language on app init:', savedLanguage);
          } catch (error) {
            console.error('Error applying saved language on init:', error);
          }
        }
        
        console.log('App initialization completed successfully');
        setAppInitialized(true);
        setInitError(null);
      } catch (error) {
        console.error('Failed to initialize services:', error);
        setInitError(error instanceof Error ? error.message : 'Failed to initialize app');
        // Continue anyway to prevent complete app failure
        setAppInitialized(true);
      }
    };

    initializeApp();
  }, []);

  const handleAuthComplete = () => {
    dispatch(setOnboardingCompleted());
  };

  // Show loading while auth is being determined or app is initializing
  if (authLoading || !appInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">
            {authLoading ? 'Loading...' : 'Initializing KisanShakti AI...'}
          </p>
          {initError && (
            <p className="text-red-600 text-sm mt-2">
              Warning: {initError}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Show auth screen if user is not authenticated or hasn't completed onboarding
  if (!isAuthenticated || !onboardingCompleted) {
    return <PhoneAuthScreen onComplete={handleAuthComplete} />;
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
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/community" element={<Community />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<DashboardHome />} />
      </Routes>
    </MobileLayout>
  );
};
