
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useAuth } from '@/hooks/useAuth';
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
  User,
  Settings
} from 'lucide-react';

export const DashboardHeader: React.FC = () => {
  const { t } = useTranslation('dashboard');
  const { profile } = useAuth();
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

  // Update time and greeting with enhanced logic
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now);
      
      const hour = now.getHours();
      if (hour < 6) {
        setGreeting(t('welcome.lateNight'));
      } else if (hour < 12) {
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
    const interval = setInterval(updateTime, 60000);
    
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

  // Extract first name from full name or use default
  const getFirstName = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ')[0];
    }
    return t('welcome.defaultFarmerName');
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/50 safe-area-top">
      {/* Enhanced Status Bar with Professional Design */}
      <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-secondary/5 border-b border-primary/10">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center space-x-3">
            {/* Connection Status with Enhanced Styling */}
            <div className={`flex items-center space-x-2 text-xs font-medium px-3 py-1 rounded-full ${
              isOnline 
                ? 'text-green-700 bg-green-100 border border-green-200' 
                : 'text-orange-700 bg-orange-100 border border-orange-200'
            }`}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span>{isOnline ? t('status.online') : t('status.offline')}</span>
            </div>
            
            {/* Tenant Branding Badge */}
            {tenantBranding?.app_name && (
              <Badge 
                variant="secondary" 
                className="text-xs font-semibold border-primary/20"
                style={{ 
                  backgroundColor: `${tenantBranding.primary_color}15`,
                  color: tenantBranding.primary_color,
                  borderColor: `${tenantBranding.primary_color}30`
                }}
              >
                {tenantBranding.app_name}
              </Badge>
            )}
          </div>
          
          {/* Professional Time Display */}
          <div className="text-xs text-muted-foreground font-semibold tracking-wider">
            {formatTime(currentTime)}
          </div>
        </div>
      </div>

      {/* Enhanced Main Header */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section - Enhanced Profile & Greeting */}
          <div className="flex items-center space-x-4 flex-1">
            {/* Professional Profile Avatar */}
            <div className="relative">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center border-2 border-white shadow-xl backdrop-blur-sm transition-all duration-300 hover:scale-105"
                style={{ 
                  background: tenantBranding?.primary_color 
                    ? `linear-gradient(135deg, ${tenantBranding.primary_color}20, ${tenantBranding.secondary_color || tenantBranding.primary_color}20)`
                    : 'linear-gradient(135deg, #10b98120, #05966920)'
                }}
              >
                {tenantBranding?.logo_url ? (
                  <img 
                    src={tenantBranding.logo_url} 
                    alt={tenantBranding.app_name || "Logo"} 
                    className="w-9 h-9 rounded-xl object-contain"
                  />
                ) : (
                  <User 
                    className="w-7 h-7"
                    style={{ color: tenantBranding?.primary_color || '#10b981' }}
                  />
                )}
              </div>
              
              {/* Online Status Indicator */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-3 border-white flex items-center justify-center shadow-lg">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>

            {/* Enhanced Greeting Section */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                {getGreetingIcon()}
                <h1 className="text-lg font-bold text-foreground truncate">
                  {greeting}, {getFirstName()}!
                </h1>
              </div>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-muted-foreground font-medium">
                  {formatDate(currentTime)}
                </p>
                <div className="w-1 h-1 bg-muted-foreground/30 rounded-full"></div>
                <span className="text-xs text-muted-foreground">
                  {t('header.welcome')}
                </span>
              </div>
            </div>
          </div>

          {/* Enhanced Right Section - Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Professional Search Button */}
            <Button
              variant="ghost"
              size="sm"
              className="w-11 h-11 rounded-xl hover:bg-muted/80 backdrop-blur-sm border border-transparent hover:border-border/50 transition-all duration-200"
            >
              <Search className="w-5 h-5" />
            </Button>

            {/* Enhanced Notifications with Badge */}
            <Button
              variant="ghost"
              size="sm"
              className="w-11 h-11 rounded-xl hover:bg-muted/80 backdrop-blur-sm border border-transparent hover:border-border/50 transition-all duration-200 relative"
            >
              <Bell className="w-5 h-5" />
              <div 
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-lg"
                style={{ backgroundColor: tenantBranding?.accent_color || '#f59e0b' }}
              >
                <span className="text-xs text-white font-bold">3</span>
              </div>
            </Button>

            {/* Professional Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="w-11 h-11 rounded-xl hover:bg-muted/80 backdrop-blur-sm border border-transparent hover:border-border/50 transition-all duration-200"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Enhanced Quick Stats Bar with Professional Design */}
        <div className="mt-5 p-4 bg-gradient-to-r from-muted/40 via-muted/60 to-muted/40 rounded-2xl border border-border/30 backdrop-blur-sm shadow-lg">
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center group">
              <div 
                className="text-base font-bold mb-1 transition-colors duration-200"
                style={{ color: tenantBranding?.primary_color || '#10b981' }}
              >
                ₹2.4L
              </div>
              <div className="text-xs text-muted-foreground font-medium group-hover:text-foreground transition-colors duration-200">
                {t('quickOverview.netIncome')}
              </div>
            </div>
            
            <div className="text-center border-x border-border/40 group">
              <div className="text-base font-bold text-green-600 mb-1 transition-colors duration-200">
                12.5 Ac
              </div>
              <div className="text-xs text-muted-foreground font-medium group-hover:text-foreground transition-colors duration-200">
                {t('quickOverview.totalLand')}
              </div>
            </div>
            
            <div className="text-center group">
              <div className="text-base font-bold text-blue-600 mb-1 transition-colors duration-200">
                8 {t('quickOverview.crops')}
              </div>
              <div className="text-xs text-muted-foreground font-medium group-hover:text-foreground transition-colors duration-200">
                {t('quickOverview.activeCrops')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
