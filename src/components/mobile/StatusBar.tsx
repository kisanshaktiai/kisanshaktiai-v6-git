
import React from 'react';
import { useTranslation } from 'react-i18next';
import { WifiOff, Wifi } from 'lucide-react';

interface StatusBarProps {
  isOnline: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({ isOnline }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-primary text-primary-foreground px-4 py-2 safe-area-top">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h1 className="text-lg font-semibold">KisanShaktiAI</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <>
              <Wifi className="h-4 w-4" />
              <span className="text-xs">{t('common.online')}</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4" />
              <span className="text-xs">{t('common.offline')}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
