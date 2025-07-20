
import { useState, useEffect } from 'react';
import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';
import { PluginListenerHandle } from '@capacitor/core';
import { syncService } from '../services/offline/syncService';

export const useOffline = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ 
    pending: 0, 
    errors: 0, 
    isOnline: true, 
    syncInProgress: false 
  });

  useEffect(() => {
    let networkListener: PluginListenerHandle | null = null;

    const checkNetworkStatus = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          const status = await Network.getStatus();
          setIsOffline(!status.connected);
        } else {
          setIsOffline(!navigator.onLine);
        }
      } catch (error) {
        console.error('useOffline: Error checking network status:', error);
        // Fallback to browser API
        setIsOffline(!navigator.onLine);
      }
    };

    const updateSyncStatus = async () => {
      try {
        const status = await syncService.getQueueStatus();
        setSyncStatus(status);
      } catch (error) {
        console.error('useOffline: Error getting sync status:', error);
      }
    };

    const initializeNetworkListener = async () => {
      // Initial checks
      await checkNetworkStatus();
      await updateSyncStatus();

      try {
        if (Capacitor.isNativePlatform()) {
          // Listen for network changes in native apps
          networkListener = await Network.addListener('networkStatusChange', async (status) => {
            setIsOffline(!status.connected);
            // Update sync status when network changes
            setTimeout(updateSyncStatus, 1000);
          });
        } else {
          // Listen for network changes in web browsers
          const handleOnline = async () => {
            setIsOffline(false);
            setTimeout(updateSyncStatus, 1000);
          };
          
          const handleOffline = () => {
            setIsOffline(true);
          };

          window.addEventListener('online', handleOnline);
          window.addEventListener('offline', handleOffline);

          // Cleanup function for web listeners
          return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
          };
        }
      } catch (error) {
        console.error('useOffline: Error setting up network listener:', error);
        // Fallback to periodic checking
        const fallbackInterval = setInterval(checkNetworkStatus, 5000);
        return () => clearInterval(fallbackInterval);
      }
    };

    const cleanup = initializeNetworkListener();

    // Periodic sync status updates (every 10 seconds)
    const syncInterval = setInterval(updateSyncStatus, 10000);

    return () => {
      if (networkListener) {
        networkListener.remove();
      }
      clearInterval(syncInterval);
      
      // Handle cleanup function from initializeNetworkListener
      if (cleanup && typeof cleanup.then === 'function') {
        cleanup.then(cleanupFn => cleanupFn && cleanupFn());
      } else if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, []);

  const forceSync = async () => {
    if (!isOffline) {
      await syncService.forcSync();
      setTimeout(async () => {
        const status = await syncService.getQueueStatus();
        setSyncStatus(status);
      }, 1000);
    }
  };

  const clearFailedItems = async () => {
    const clearedCount = await syncService.clearFailedItems();
    const status = await syncService.getQueueStatus();
    setSyncStatus(status);
    return clearedCount;
  };

  return {
    isOffline,
    isOnline: !isOffline,
    syncStatus,
    hasPendingSync: syncStatus.pending > 0 || syncStatus.errors > 0,
    forceSync,
    clearFailedItems,
  };
};
