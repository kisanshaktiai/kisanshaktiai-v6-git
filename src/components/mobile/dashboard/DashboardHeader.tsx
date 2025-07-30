import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useAuth } from '@/hooks/useAuth';
import { RootState } from '@/store';
import { useUnifiedTenantData } from '@/hooks';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  Search, 
  User
} from 'lucide-react';

export const DashboardHeader: React.FC = () => {
  const { t } = useTranslation('dashboard');
  const { profile } = useAuth();
  const { currentTenant } = useSelector((state: RootState) => state.auth);
  const { branding } = useUnifiedTenantData(currentTenant);
  const [greeting, setGreeting] = useState('');

  // Update greeting
  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
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

    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);
    
    return () => clearInterval(interval);
  }, [t]);

  // Extract first name
  const getFirstName = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ')[0];
    }
    return t('welcome.defaultFarmerName');
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/50 safe-area-top">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section - Profile & Greeting */}
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-white shadow-lg backdrop-blur-sm"
                style={{ 
                  background: branding?.primary_color 
                    ? `${branding.primary_color}20`
                    : '#10b98120'
                }}
              >
                {branding?.logo_url ? (
                  <img 
                    src={branding.logo_url} 
                    alt={branding.app_name || "Logo"} 
                    className="w-8 h-8 rounded-full object-contain"
                  />
                ) : (
                  <User 
                    className="w-6 h-6"
                    style={{ color: branding?.primary_color || '#10b981' }}
                  />
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground">
                {greeting}, {getFirstName()}!
              </h1>
              <p className="text-sm text-muted-foreground">
                {t('header.welcome')}
              </p>
            </div>
          </div>

          {/* Right Section - Action Buttons */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-10 h-10 rounded-full hover:bg-muted/80"
              aria-label={t('header.search')}
            >
              <Search className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="w-10 h-10 rounded-full hover:bg-muted/80 relative"
              aria-label={t('header.notifications')}
            >
              <Bell className="w-5 h-5" />
              <div 
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-lg"
                style={{ backgroundColor: branding?.accent_color || '#f59e0b' }}
              >
                <span className="text-xs text-white font-bold">3</span>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
