
import React, { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { OfflineIndicator } from '../common/OfflineIndicator';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { tenantBranding } = useSelector((state: RootState) => state.tenant);

  // Apply tenant branding
  React.useEffect(() => {
    if (tenantBranding) {
      const root = document.documentElement;
      if (tenantBranding.primary_color) {
        root.style.setProperty('--color-primary', tenantBranding.primary_color);
      }
      if (tenantBranding.secondary_color) {
        root.style.setProperty('--color-secondary', tenantBranding.secondary_color);
      }
      if (tenantBranding.background_color) {
        root.style.setProperty('--color-background', tenantBranding.background_color);
      }
    }
  }, [tenantBranding]);

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
