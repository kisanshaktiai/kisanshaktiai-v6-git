
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { ModernBottomNavigation } from './navigation/ModernBottomNavigation';
import { ModernHeader } from './navigation/ModernHeader';
import { StatusBar } from './StatusBar';

interface MobileLayoutProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
  showHeader?: boolean;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ 
  children, 
  showBottomNav = true,
  showHeader = true 
}) => {
  const { isOnline } = useSelector((state: RootState) => state.sync);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StatusBar isOnline={isOnline} />
      
      {showHeader && <ModernHeader />}
      
      <main className="flex-1 overflow-auto pb-safe">
        {children}
      </main>
      
      {showBottomNav && <ModernBottomNavigation />}
    </div>
  );
};
