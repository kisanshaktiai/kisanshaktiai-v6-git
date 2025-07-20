
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { useBranding } from '@/contexts/BrandingContext';
import { EnhancedSplashScreen } from '@/components/splash/EnhancedSplashScreen';
import { MobileLayout } from './MobileLayout';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

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
  const { isAuthenticated, loading: authLoading } = useCustomAuth();
  const { branding, loading: brandingLoading } = useBranding();
  const [appInitialized, setAppInitialized] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (!authLoading && !brandingLoading && isAuthenticated) {
      setAppInitialized(true);
    }
  }, [authLoading, brandingLoading, isAuthenticated]);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  // Show loading while auth is being determined or app is initializing
  if (authLoading || !appInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">
            {authLoading ? 'Authenticating...' : 'Initializing app...'}
          </p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Show splash screen on first load
  if (showSplash) {
    return <EnhancedSplashScreen onComplete={handleSplashComplete} />;
  }

  // Apply tenant theming to body
  useEffect(() => {
    if (branding) {
      document.body.style.setProperty('--tenant-primary', branding.primaryColor);
      document.body.style.setProperty('--tenant-secondary', branding.secondaryColor);
      document.body.style.setProperty('--tenant-accent', branding.accentColor);
    }
  }, [branding]);

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
