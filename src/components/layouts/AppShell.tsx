
import React, { ReactNode, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTenant } from '../../hooks/useTenant';
import { LoadingScreen } from '../common/LoadingScreen';
import { initializeCapacitor } from '../../config/capacitor';
import { syncService } from '../../services/offline/syncService';

interface AppShellProps {
  children: ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { loading: authLoading } = useAuth();
  const { loading: tenantLoading } = useTenant();

  useEffect(() => {
    const initializeApp = async () => {
      // Initialize Capacitor
      await initializeCapacitor();
      
      // Initialize sync service
      await syncService.initialize();
    };

    initializeApp();
  }, []);

  if (authLoading || tenantLoading) {
    return <LoadingScreen message="Initializing app..." />;
  }

  return <>{children}</>;
};

export default AppShell;
