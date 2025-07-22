
import React, { ReactNode, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../hooks/useTenant';
import { LoadingScreen } from '../common/LoadingScreen';
import { OfflineIndicator } from '../common/OfflineIndicator';
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
      try {
        console.log('AppShell: Initializing app...');
        
        // Initialize Capacitor first
        await initializeCapacitor();
        console.log('AppShell: Capacitor initialized');
        
        // Initialize sync service
        await syncService.initialize();
        console.log('AppShell: SyncService initialized');
        
      } catch (error) {
        console.error('AppShell: Initialization error:', error);
      }
    };

    initializeApp();

    // Cleanup function
    return () => {
      syncService.destroy();
    };
  }, []);

  if (authLoading || tenantLoading) {
    return <LoadingScreen message="Initializing app..." />;
  }

  return (
    <>
      <OfflineIndicator />
      {children}
    </>
  );
};

export default AppShell;
