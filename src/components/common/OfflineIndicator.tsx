
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useOffline } from '../../hooks/useOffline';
import { WifiOff, RefreshCw, AlertCircle } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const { t } = useTranslation();
  const { isOffline, syncStatus } = useOffline();

  if (!isOffline && syncStatus.pending === 0 && syncStatus.errors === 0) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isOffline ? (
            <>
              <WifiOff className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                {t('offline.workingOffline', 'Working offline')}
              </span>
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
              <span className="text-sm text-blue-800">
                {t('sync.syncing', 'Syncing data...')}
              </span>
            </>
          )}
        </div>

        {(syncStatus.pending > 0 || syncStatus.errors > 0) && (
          <div className="flex items-center space-x-2">
            {syncStatus.errors > 0 && (
              <div className="flex items-center space-x-1">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-xs text-red-600">
                  {syncStatus.errors} {t('sync.errors', 'errors')}
                </span>
              </div>
            )}
            {syncStatus.pending > 0 && (
              <span className="text-xs text-gray-600">
                {syncStatus.pending} {t('sync.pending', 'pending')}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
