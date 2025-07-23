
import { useState, useEffect } from 'react';

interface NetworkState {
  isOnline: boolean;
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
  downlink: number;
  rtt: number;
}

export const useNetworkState = () => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isOnline: navigator.onLine,
    connectionType: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0
  });

  const [showOfflineBanner, setShowOfflineBanner] = useState(false);

  useEffect(() => {
    const updateNetworkState = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      
      setNetworkState({
        isOnline: navigator.onLine,
        connectionType: connection?.type || 'unknown',
        effectiveType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || 0,
        rtt: connection?.rtt || 0
      });
    };

    const handleOnline = () => {
      updateNetworkState();
      setShowOfflineBanner(false);
      // Trigger sync when connection restored
      window.dispatchEvent(new CustomEvent('connection-restored'));
    };

    const handleOffline = () => {
      updateNetworkState();
      setShowOfflineBanner(true);
    };

    const handleConnectionChange = () => {
      updateNetworkState();
    };

    // Initial state
    updateNetworkState();

    // Event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  const isSlowConnection = (): boolean => {
    return networkState.effectiveType === 'slow-2g' || networkState.effectiveType === '2g';
  };

  const estimateConnectionQuality = (): 'poor' | 'fair' | 'good' | 'excellent' => {
    if (!networkState.isOnline) return 'poor';
    
    const { effectiveType, downlink, rtt } = networkState;
    
    if (effectiveType === 'slow-2g' || downlink < 0.5 || rtt > 2000) return 'poor';
    if (effectiveType === '2g' || downlink < 1.5 || rtt > 1000) return 'fair';
    if (effectiveType === '3g' || downlink < 10 || rtt > 500) return 'good';
    return 'excellent';
  };

  return {
    ...networkState,
    showOfflineBanner,
    isSlowConnection,
    estimateConnectionQuality
  };
};
