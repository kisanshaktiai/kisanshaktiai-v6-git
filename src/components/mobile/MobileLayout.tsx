
import React from 'react';
import { ModernBottomNavigation } from './navigation/ModernBottomNavigation';
import { DashboardHeader } from './dashboard/DashboardHeader';

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
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {showHeader && <DashboardHeader />}
      
      <main className={`flex-1 overflow-auto pb-safe ${showHeader ? 'pt-0' : ''}`}>
        {children}
      </main>
      
      {showBottomNav && <ModernBottomNavigation />}
    </div>
  );
};
