
import { useState, useEffect } from 'react';
import { Network } from '@capacitor/network';
import { syncService } from '../services/offline/syncService';

export const useOffline = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ pending: 0, errors: 0 });

  useEffect(() => {
    const checkNetworkStatus = async () => {
      const status = await Network.getStatus();
      setIsOffline(!status.connected);
    };

    const updateSyncStatus = async () => {
      const status = await syncService.getQueueStatus();
      setSyncStatus(status);
    };

    // Initial check
    checkNetworkStatus();
    updateSyncStatus();

    // Listen for network changes
    const networkListener = Network.addListener('networkStatusChange', (status) => {
      setIsOffline(!status.connected);
      if (status.connected) {
        // Update sync status when coming back online
        setTimeout(updateSyncStatus, 1000);
      }
    });

    // Periodic sync status updates
    const syncInterval = setInterval(updateSyncStatus, 30000); // Every 30 seconds

    return () => {
      networkListener.remove();
      clearInterval(syncInterval);
    };
  }, []);

  return {
    isOffline,
    isOnline: !isOffline,
    syncStatus,
    hasPendingSync: syncStatus.pending > 0 || syncStatus.errors > 0,
  };
};
