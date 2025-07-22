
import React from 'react';
import { Wifi, WifiOff, Battery, Signal } from 'lucide-react';

export interface StatusBarProps {
  isOnline: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({ isOnline }) => {
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="status-bar bg-background h-7 px-3 flex items-center justify-between text-xs text-foreground border-b border-border">
      <div className="status-left">
        {currentTime}
      </div>
      <div className="status-right flex items-center space-x-2">
        {isOnline ? 
          <Wifi className="w-3 h-3" /> : 
          <WifiOff className="w-3 h-3 text-red-500" />
        }
        <Signal className="w-3 h-3" />
        <Battery className="w-3 h-3" />
      </div>
    </div>
  );
};
