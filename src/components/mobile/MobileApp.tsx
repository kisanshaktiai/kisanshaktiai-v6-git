
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { useBranding } from '@/contexts/BrandingContext';
import { EnhancedSplashScreen } from '@/components/splash/EnhancedSplashScreen';
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
  const { branding, loading: brandingLoading } = useBranding();
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Always show splash screen first when app loads
  if (showSplash || brandingLoading) {
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
