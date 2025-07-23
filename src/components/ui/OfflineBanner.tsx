
import React from 'react';
import { useTranslation } from 'react-i18next';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from './button';
import { useNetworkState } from '@/hooks/useNetworkState';
import { offlineSyncManager } from '@/services/sync/offlineSyncManager';

export const OfflineBanner: React.FC = () => {
  const { t } = useTranslation();
  const { showOfflineBanner, isOnline } = useNetworkState();
  const [syncStatus, setSyncStatus] = React.useState({ pending: 0, failed: 0 });

  React.useEffect(() => {
    const updateSyncStatus = () => {
      setSyncStatus(offlineSyncManager.getSyncStatus());
    };

    updateSyncStatus();
    const interval = setInterval(updateSyncStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleForceSync = async () => {
    if (isOnline) {
      await offlineSyncManager.forceSyncNow();
    }
  };

  if (!showOfflineBanner) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-500 to-red-500 text-white p-3 shadow-lg">
      <div className="flex items-center justify-between max-w-md mx-auto">
        <div className="flex items-center space-x-2">
          <WifiOff className="w-5 h-5" />
          <div>
            <p className="text-sm font-medium">{t('common.offline_mode')}</p>
            {syncStatus.pending > 0 && (
              <p className="text-xs opacity-90">
                {t('common.pending_sync', { count: syncStatus.pending })}
              </p>
            )}
          </div>
        </div>
        
        {isOnline && syncStatus.pending > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleForceSync}
            className="text-white hover:bg-white/20"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
