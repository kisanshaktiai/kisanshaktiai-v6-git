
import { useState, useEffect, useCallback } from 'react';
import { tenantApiService } from '@/services/TenantApiService';
import { offlineManager } from '@/services/OfflineManager';

interface UseTenantDataOptions {
  enabled?: boolean;
  refetchOnMount?: boolean;
  cacheKey?: string;
  requireOnline?: boolean;
}

interface UseTenantDataResult<T> {
  data: T | null;
  loading: boolean;
  error: any;
  fromCache: boolean;
  refetch: () => Promise<void>;
  mutate: (newData: T) => void;
}

export function useTenantData<T>(
  table: string,
  query: any = {},
  options: UseTenantDataOptions = {}
): UseTenantDataResult<T[]> {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [fromCache, setFromCache] = useState(false);

  const fetchData = useCallback(async () => {
    if (!options.enabled && options.enabled !== undefined) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await tenantApiService.queryWithTenant<T>(table, query, {
        useCache: true,
        cacheKey: options.cacheKey,
        requireOnline: options.requireOnline
      });

      if (result.error) {
        setError(result.error);
        setData(null);
      } else {
        setData(result.data);
        setFromCache(result.fromCache || false);
      }
    } catch (err) {
      setError(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [table, JSON.stringify(query), options.cacheKey, options.requireOnline, options.enabled]);

  useEffect(() => {
    if (options.refetchOnMount !== false) {
      fetchData();
    }
  }, [fetchData, options.refetchOnMount]);

  // Listen for network status changes
  useEffect(() => {
    const handleNetworkChange = (event: any) => {
      // Refetch when coming back online if we have cached data
      if (event.detail.isOnline && fromCache) {
        fetchData();
      }
    };

    window.addEventListener('network-status-change', handleNetworkChange);
    return () => window.removeEventListener('network-status-change', handleNetworkChange);
  }, [fetchData, fromCache]);

  const mutate = useCallback((newData: T[]) => {
    setData(newData);
  }, []);

  return {
    data,
    loading,
    error,
    fromCache,
    refetch: fetchData,
    mutate
  };
}

// Specialized hooks for common data types
export function useTenantLands(farmerId: string) {
  return useTenantData('lands', {
    select: '*',
    filters: { farmer_id: farmerId }
  }, {
    cacheKey: `lands_${farmerId}`,
    enabled: !!farmerId
  });
}

export function useTenantCropHistory(landId: string) {
  return useTenantData('crop_history', {
    select: '*',
    filters: { land_id: landId }
  }, {
    cacheKey: `crop_history_${landId}`,
    enabled: !!landId
  });
}

export function useTenantHealthAssessments(landId: string) {
  return useTenantData('crop_health_assessments', {
    select: '*',
    filters: { land_id: landId }
  }, {
    cacheKey: `health_assessments_${landId}`,
    enabled: !!landId
  });
}

export function useTenantTransactions(farmerId: string) {
  return useTenantData('financial_transactions', {
    select: '*',
    filters: { farmer_id: farmerId }
  }, {
    cacheKey: `transactions_${farmerId}`,
    enabled: !!farmerId
  });
}

// Mutation hook
export function useTenantMutation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const mutate = useCallback(async (
    operation: 'create' | 'update' | 'delete',
    table: string,
    data: any
  ) => {
    setLoading(true);
    setError(null);

    try {
      const result = await tenantApiService.mutateWithTenant(operation, table, data);
      
      if (result.error) {
        setError(result.error);
        return { success: false, data: null, error: result.error };
      }

      return { success: true, data: result.data, error: null };
    } catch (err) {
      setError(err);
      return { success: false, data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, loading, error };
}

// Realtime hook
export function useTenantRealtime(eventType: string, callback: (payload: any) => void) {
  useEffect(() => {
    const handleRealtimeUpdate = (event: any) => {
      callback(event.detail);
    };

    const eventName = `tenant-realtime-${eventType}`;
    window.addEventListener(eventName, handleRealtimeUpdate);
    
    return () => {
      window.removeEventListener(eventName, handleRealtimeUpdate);
    };
  }, [eventType, callback]);
}
