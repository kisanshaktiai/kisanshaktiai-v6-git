
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useOffline } from '../../hooks/useOffline';
import { WifiOff, RefreshCw, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Button } from '../ui/button';

export const OfflineIndicator: React.FC = () => {
  const { t } = useTranslation();
  const { isOffline, syncStatus, forceSync, clearFailedItems } = useOffline();

  const handleForceSync = async () => {
    try {
      await forceSync();
    } catch (error) {
      console.error('Error forcing sync:', error);
    }
  };

  const handleClearFailedItems = async () => {
    try {
      const clearedCount = await clearFailedItems();
      console.log(`Cleared ${clearedCount} failed items`);
    } catch (error) {
      console.error('Error clearing failed items:', error);
    }
  };

  // Don't show indicator if online and no pending/failed syncs
  if (!isOffline && syncStatus.pending === 0 && syncStatus.errors === 0) {
    return null;
  }

  return (
    <div className={`border-b px-4 py-2 ${
      isOffline 
        ? 'bg-red-50 border-red-200' 
        : syncStatus.errors > 0 
          ? 'bg-yellow-50 border-yellow-200'
          : 'bg-blue-50 border-blue-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isOffline ? (
            <>
              <WifiOff className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-800">
                {t('offline.workingOffline', 'Working offline')}
              </span>
            </>
          ) : syncStatus.syncInProgress ? (
            <>
              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
              <span className="text-sm text-blue-800">
                {t('sync.syncing', 'Syncing data...')}
              </span>
            </>
          ) : syncStatus.errors > 0 ? (
            <>
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                {t('sync.syncIssues', 'Sync issues detected')}
              </span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-800">
                {t('sync.syncComplete', 'Sync complete')}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {/* Sync Status Info */}
          <div className="flex items-center space-x-2 text-xs">
            {syncStatus.pending > 0 && (
              <span className="text-gray-600">
                {syncStatus.pending} {t('sync.pending', 'pending')}
              </span>
            )}
            {syncStatus.errors > 0 && (
              <div className="flex items-center space-x-1">
                <AlertCircle className="w-3 h-3 text-red-500" />
                <span className="text-red-600">
                  {syncStatus.errors} {t('sync.errors', 'errors')}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1">
            {!isOffline && !syncStatus.syncInProgress && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleForceSync}
                className="h-6 px-2 text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                {t('sync.forceSync', 'Sync')}
              </Button>
            )}
            
            {syncStatus.errors > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFailedItems}
                className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
              >
                <X className="w-3 h-3 mr-1" />
                {t('sync.clearErrors', 'Clear')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Additional status details */}
      {(syncStatus.pending > 0 || syncStatus.errors > 0) && (
        <div className="mt-1 text-xs text-gray-600">
          {isOffline 
            ? t('sync.offlineMessage', 'Changes will sync when connection is restored')
            : t('sync.onlineMessage', 'Data synchronization in progress')
          }
        </div>
      )}
    </div>
  );
};
