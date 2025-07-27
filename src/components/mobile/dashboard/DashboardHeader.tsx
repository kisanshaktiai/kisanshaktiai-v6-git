
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  Search, 
  Menu,
  Wifi, 
  WifiOff,
  Sun,
  Moon,
  Cloud,
  User,
  Settings
} from 'lucide-react';

export const DashboardHeader: React.FC = () => {
  const { t } = useTranslation('dashboard');
  const { profile } = useSelector((state: RootState) => state.farmer);
  const { tenantBranding } = useSelector((state: RootState) => state.tenant);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');

  // Update connection status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update time and greeting
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now);
      
      const hour = now.getHours();
      if (hour < 12) {
        setGreeting(t('welcome.goodMorning'));
      } else if (hour < 17) {
        setGreeting(t('welcome.goodAfternoon'));
      } else if (hour < 21) {
        setGreeting(t('welcome.goodEvening'));
      } else {
        setGreeting(t('welcome.goodNight'));
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [t]);

  const getGreetingIcon = () => {
    const hour = currentTime.getHours();
    if (hour >= 6 && hour < 18) {
      return <Sun className="w-5 h-5 text-yellow-500" />;
    } else {
      return <Moon className="w-5 h-5 text-blue-400" />;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { 
      weekday: 'long',
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/50 safe-area-top">
      {/* Status Bar */}
      <div className="bg-primary/5 border-b border-primary/10">
        <div className="flex items-center justify-between px-4 py-1">
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-1 text-xs ${isOnline ? 'text-green-600' : 'text-orange-600'}`}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span className="font-medium">
                {isOnline ? t('status.online') : t('status.offline')}
              </span>
            </div>
            {tenantBranding?.app_name && (
              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                {tenantBranding.app_name}
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground font-medium">
            {formatTime(currentTime)}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section - Greeting & Profile */}
          <div className="flex items-center space-x-3 flex-1">
            {/* Profile Avatar */}
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border-2 border-white shadow-lg backdrop-blur-sm">
                {tenantBranding?.logo_url ? (
                  <img 
                    src={tenantBranding.logo_url} 
                    alt="Logo" 
                    className="w-8 h-8 rounded-xl object-contain"
                  />
                ) : (
                  <User className="w-6 h-6 text-primary" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>

            {/* Greeting */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                {getGreetingIcon()}
                <h1 className="text-lg font-bold text-foreground truncate">
                  {greeting}, {profile?.full_name?.split(' ')[0] || t('welcome.defaultFarmerName')}!
                </h1>
              </div>
              <p className="text-sm text-muted-foreground font-medium">
                {formatDate(currentTime)}
              </p>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center space-x-2">
            {/* Search Button */}
            <Button
              variant="ghost"
              size="sm"
              className="w-10 h-10 rounded-xl hover:bg-muted/80 backdrop-blur-sm"
            >
              <Search className="w-5 h-5" />
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="w-10 h-10 rounded-xl hover:bg-muted/80 backdrop-blur-sm relative"
            >
              <Bell className="w-5 h-5" />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">3</span>
              </div>
            </Button>

            {/* Menu */}
            <Button
              variant="ghost"
              size="sm"
              className="w-10 h-10 rounded-xl hover:bg-muted/80 backdrop-blur-sm"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="mt-4 p-3 bg-gradient-to-r from-muted/50 to-muted/30 rounded-2xl border border-border/50 backdrop-blur-sm">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-sm font-bold text-primary">₹2.4L</div>
              <div className="text-xs text-muted-foreground">{t('quickOverview.netIncome')}</div>
            </div>
            <div className="text-center border-x border-border/30">
              <div className="text-sm font-bold text-green-600">12.5 Ac</div>
              <div className="text-xs text-muted-foreground">{t('quickOverview.totalLand')}</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-blue-600">8 {t('quickOverview.crops')}</div>
              <div className="text-xs text-muted-foreground">{t('quickOverview.activeCrops')}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
