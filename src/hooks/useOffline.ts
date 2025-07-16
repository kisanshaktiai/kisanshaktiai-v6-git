
import { useState, useEffect } from 'react';
import { Network, PluginListenerHandle } from '@capacitor/network';
import { syncService } from '../services/offline/syncService';

export const useOffline = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ pending: 0, errors: 0 });

  useEffect(() => {
    let networkListener: PluginListenerHandle | null = null;

    const checkNetworkStatus = async () => {
      const status = await Network.getStatus();
      setIsOffline(!status.connected);
    };

    const updateSyncStatus = async () => {
      const status = await syncService.getQueueStatus();
      setSyncStatus(status);
    };

    const initializeNetworkListener = async () => {
      // Initial check
      await checkNetworkStatus();
      await updateSyncStatus();

      // Listen for network changes
      networkListener = await Network.addListener('networkStatusChange', (status) => {
        setIsOffline(!status.connected);
        if (status.connected) {
          // Update sync status when coming back online
          setTimeout(updateSyncStatus, 1000);
        }
      });
    };

    initializeNetworkListener();

    // Periodic sync status updates
    const syncInterval = setInterval(updateSyncStatus, 30000); // Every 30 seconds

    return () => {
      if (networkListener) {
        networkListener.remove();
      }
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
