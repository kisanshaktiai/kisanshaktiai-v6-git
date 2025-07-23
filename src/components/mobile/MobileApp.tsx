
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardScreen } from './dashboard/DashboardScreen';
import { ChatScreen } from './chat/ChatScreen';
import { CommunityScreen } from './community/CommunityScreen';
import { ProfileScreen } from './profile/ProfileScreen';
import { BottomNavigation } from './navigation/BottomNavigation';

export const MobileApp: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen relative">
        <main className="pb-16">
          <Routes>
            <Route path="/" element={<Navigate to="/mobile/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardScreen />} />
            <Route path="/chat" element={<ChatScreen />} />
            <Route path="/community" element={<CommunityScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
          </Routes>
        </main>
        <BottomNavigation />
      </div>
    </div>
  );
};
