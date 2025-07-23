
import React from 'react';
import { StatusBar } from './StatusBar';
import { BottomNavigation } from './BottomNavigation';

interface MobileLayoutProps {
  children: React.ReactNode;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <StatusBar />
      <main className="pb-16">
        {children}
      </main>
      <BottomNavigation />
    </div>
  );
};
