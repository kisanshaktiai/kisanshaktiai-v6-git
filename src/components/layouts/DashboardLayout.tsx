
import React, { ReactNode } from 'react';
import { useUnifiedTenantData } from '@/hooks';
import { OfflineIndicator } from '../common/OfflineIndicator';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { branding } = useUnifiedTenantData();

  // Apply tenant branding
  React.useEffect(() => {
    if (branding) {
      const root = document.documentElement;
      if (branding.primary_color) {
        root.style.setProperty('--color-primary', branding.primary_color);
      }
      if (branding.secondary_color) {
        root.style.setProperty('--color-secondary', branding.secondary_color);
      }
      if (branding.background_color) {
        root.style.setProperty('--color-background', branding.background_color);
      }
    }
  }, [branding]);

  return (
    <div className="min-h-screen bg-gray-50">
      <OfflineIndicator />
      <main className="pb-20"> {/* Space for bottom navigation */}
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
