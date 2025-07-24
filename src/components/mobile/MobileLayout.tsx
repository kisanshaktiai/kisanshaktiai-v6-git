
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { BottomNavigation } from './BottomNavigation';
import { StatusBar } from './StatusBar';

interface MobileLayoutProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ 
  children, 
  showBottomNav = true 
}) => {
  const { isOnline } = useSelector((state: RootState) => state.sync);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StatusBar isOnline={isOnline} />
      
      <main className="flex-1 overflow-auto pb-safe">
        {children}
      </main>
      
      {showBottomNav && <BottomNavigation />}
    </div>
  );
};
