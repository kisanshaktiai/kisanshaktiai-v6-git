import React, { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { StatusBar } from './StatusBar';
import { BottomNavigation } from './BottomNavigation';
import { MobileHome } from '../home/MobileHome';
import { Weather } from '../weather/Weather';
import { MyLands } from '../lands/MyLands';
import { Market } from '../market/Market';
import { CropSchedule } from '../schedule/CropSchedule';
import { Analytics } from '../analytics/Analytics';
import { SatelliteMonitoring } from '../satellite/SatelliteMonitoring';
import { AiChat } from '../ai-chat/AiChat';
import { Community } from '../community/Community';
import { Profile } from '../profile/Profile';
import { useSplashScreen } from '@/hooks/useSplashScreen';

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

  // Returning users skip the splash screen
  return (
    <div className="mobile-app h-full w-full">
      <StatusBar />
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
