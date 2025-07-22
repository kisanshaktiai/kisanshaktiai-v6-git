
import React, { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { StatusBar } from './StatusBar';
import { BottomNavigation } from './BottomNavigation';
import { useSplashScreen } from '@/hooks/useSplashScreen';

// Import pages from the pages directory
import MobileHome from '@/pages/mobile/MobileHome';
import Weather from '@/pages/mobile/Weather';
import MyLands from '@/pages/mobile/MyLands';
import Market from '@/pages/mobile/Market';
import CropSchedule from '@/pages/mobile/CropSchedule';
import Analytics from '@/pages/mobile/Analytics';
import SatelliteMonitoring from '@/pages/mobile/SatelliteMonitoring';
import AiChat from '@/pages/mobile/AiChat';
import Community from '@/pages/mobile/Community';
import Profile from '@/pages/mobile/Profile';

export const MobileApp: React.FC = () => {
  const { isSplashScreenVisible, hideSplashScreen } = useSplashScreen();
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate loading tenant data and hide splash screen
    const loadData = async () => {
      // Simulate data loading
      await new Promise(resolve => setTimeout(resolve, 1000));
      hideSplashScreen();
    };

    loadData();
  }, [hideSplashScreen]);

  // Update StatusBar component to include isOnline prop
  return (
    <div className="mobile-app h-full w-full">
      <StatusBar isOnline={true} />
      <div className="mobile-content h-full overflow-auto">
        <Routes>
          <Route path="/" element={<MobileHome />} />
          <Route path="/weather" element={<Weather />} />
          <Route path="/lands" element={<MyLands />} />
          <Route path="/market" element={<Market />} />
          <Route path="/schedule" element={<CropSchedule />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/satellite" element={<SatelliteMonitoring />} />
          <Route path="/ai-chat" element={<AiChat />} />
          <Route path="/community" element={<Community />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
      <BottomNavigation />
    </div>
  );
};
