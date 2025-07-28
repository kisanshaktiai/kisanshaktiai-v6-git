import { useState, useEffect, useCallback } from 'react';
import { Network } from '@capacitor/network';
import { Preferences } from '@capacitor/preferences';
import { PluginListenerHandle } from '@capacitor/core';

interface OfflineBoundary {
  id: string;
  points: Array<{ lat: number; lng: number; timestamp: number; accuracy?: number }>;
  area: number;
  centerPoint: { lat: number; lng: number } | null;
  metadata: {
    deviceInfo?: string;
    gpsAccuracy?: number;
    createdAt: string;
    walkMode?: boolean;
  };
  synced: boolean;
}

interface OfflineCache {
  boundaries: OfflineBoundary[];
  mapTiles: Record<string, string>; // tile key -> cached data
  lastCleanup: string;
}

export const useEnhancedOffline = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [pendingBoundaries, setPendingBoundaries] = useState<OfflineBoundary[]>([]);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });
  const [isSyncing, setIsSyncing] = useState(false);

  // Load cached data on mount
  useEffect(() => {
    loadOfflineCache();
  }, []);

  // Network status monitoring
  useEffect(() => {
    let networkListener: PluginListenerHandle | null = null;

    const initializeNetworkListener = async () => {
      const status = await Network.getStatus();
      setIsOffline(!status.connected);

      networkListener = await Network.addListener('networkStatusChange', (status) => {
        setIsOffline(!status.connected);
        if (status.connected) {
          // Auto-sync when coming back online
          syncPendingBoundaries();
        }
      });
    };

    initializeNetworkListener();

    return () => {
      if (networkListener) {
        networkListener.remove();
      }
    };
  }, []);

  const loadOfflineCache = async () => {
    try {
      const { value } = await Preferences.get({ key: 'offline_cache' });
      if (value) {
        const cache: OfflineCache = JSON.parse(value);
        const unsynced = cache.boundaries.filter(b => !b.synced);
        setPendingBoundaries(unsynced);
      }
    } catch (error) {
      console.error('Failed to load offline cache:', error);
    }
  };

  const saveOfflineCache = async (cache: OfflineCache) => {
    try {
      await Preferences.set({
        key: 'offline_cache',
        value: JSON.stringify(cache)
      });
    } catch (error) {
      console.error('Failed to save offline cache:', error);
    }
  };

  const saveBoundaryOffline = useCallback(async (
    points: Array<{ lat: number; lng: number }>,
    area: number,
    centerPoint: { lat: number; lng: number } | null,
    walkMode = false
  ) => {
    const boundary: OfflineBoundary = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      points: points.map(p => ({ ...p, timestamp: Date.now() })),
      area,
      centerPoint,
      metadata: {
        createdAt: new Date().toISOString(),
        walkMode,
        deviceInfo: navigator.userAgent,
      },
      synced: false,
    };

    // Add to pending boundaries
    const newPending = [...pendingBoundaries, boundary];
    setPendingBoundaries(newPending);

    // Save to local storage
    try {
      const { value } = await Preferences.get({ key: 'offline_cache' });
      const cache: OfflineCache = value ? JSON.parse(value) : { boundaries: [], mapTiles: {}, lastCleanup: new Date().toISOString() };
      cache.boundaries.push(boundary);
      await saveOfflineCache(cache);
      
      return boundary.id;
    } catch (error) {
      console.error('Failed to save boundary offline:', error);
      throw error;
    }
  }, [pendingBoundaries]);

  const syncPendingBoundaries = useCallback(async () => {
    if (isSyncing || pendingBoundaries.length === 0) return;

    setIsSyncing(true);
    setSyncProgress({ current: 0, total: pendingBoundaries.length });

    const results = {
      synced: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < pendingBoundaries.length; i++) {
      const boundary = pendingBoundaries[i];
      
      try {
        setSyncProgress({ current: i + 1, total: pendingBoundaries.length });

        // Simulate API call to sync boundary
        // In real implementation, this would call your land creation API
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mark as synced
        boundary.synced = true;
        results.synced++;

      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to sync boundary ${boundary.id}: ${error}`);
        console.error('Failed to sync boundary:', boundary.id, error);
      }
    }

    // Update cache
    try {
      const { value } = await Preferences.get({ key: 'offline_cache' });
      if (value) {
        const cache: OfflineCache = JSON.parse(value);
        cache.boundaries = cache.boundaries.map(b => 
          pendingBoundaries.find(pb => pb.id === b.id) || b
        );
        await saveOfflineCache(cache);
      }

      // Remove synced boundaries from pending
      const stillPending = pendingBoundaries.filter(b => !b.synced);
      setPendingBoundaries(stillPending);

    } catch (error) {
      console.error('Failed to update cache after sync:', error);
    }

    setIsSyncing(false);
    setSyncProgress({ current: 0, total: 0 });

    return results;
  }, [pendingBoundaries, isSyncing]);

  const deletePendingBoundary = useCallback(async (boundaryId: string) => {
    try {
      const newPending = pendingBoundaries.filter(b => b.id !== boundaryId);
      setPendingBoundaries(newPending);

      // Update cache
      const { value } = await Preferences.get({ key: 'offline_cache' });
      if (value) {
        const cache: OfflineCache = JSON.parse(value);
        cache.boundaries = cache.boundaries.filter(b => b.id !== boundaryId);
        await saveOfflineCache(cache);
      }
    } catch (error) {
      console.error('Failed to delete pending boundary:', error);
      throw error;
    }
  }, [pendingBoundaries]);

  const clearOfflineCache = useCallback(async () => {
    try {
      await Preferences.remove({ key: 'offline_cache' });
      setPendingBoundaries([]);
    } catch (error) {
      console.error('Failed to clear offline cache:', error);
      throw error;
    }
  }, []);

  return {
    isOffline,
    isOnline: !isOffline,
    pendingBoundaries,
    hasPendingBoundaries: pendingBoundaries.length > 0,
    syncProgress,
    isSyncing,
    saveBoundaryOffline,
    syncPendingBoundaries,
    deletePendingBoundary,
    clearOfflineCache,
  };
};