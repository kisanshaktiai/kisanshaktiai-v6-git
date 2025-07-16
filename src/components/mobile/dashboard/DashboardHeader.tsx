
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '@/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Settings, User } from 'lucide-react';

export const DashboardHeader: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useSelector((state: RootState) => state.farmer);
  const { isOnline } = useSelector((state: RootState) => state.sync);
  const { currentTenant, tenantBranding } = useSelector((state: RootState) => state.tenant);

  const getFarmerName = (): string => {
    // Since farmers table doesn't have a name field, we'll use a default greeting
    // In a real implementation, this would come from user_profiles table or auth metadata
    return t('dashboard.defaultFarmerName', 'Farmer');
  };

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.goodMorning', 'Good Morning');
    if (hour < 17) return t('dashboard.goodAfternoon', 'Good Afternoon');
    return t('dashboard.goodEvening', 'Good Evening');
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      {/* Top Row - Logo and Status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          {tenantBranding?.logo_url && (
            <img 
              src={tenantBranding.logo_url} 
              alt={tenantBranding.app_name || 'Logo'}
              className="w-8 h-8 rounded"
            />
          )}
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {tenantBranding?.app_name || 'KisanShakti AI'}
            </h1>
            {tenantBranding?.app_tagline && (
              <p className="text-xs text-gray-500">{tenantBranding.app_tagline}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant={isOnline ? 'default' : 'secondary'} className="text-xs">
            {isOnline ? t('status.online', 'Online') : t('status.offline', 'Offline')}
          </Badge>
          
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5" />
            <Badge className="absolute -top-1 -right-1 w-5 h-5 rounded-full p-0 flex items-center justify-center text-xs">
              3
            </Badge>
          </Button>

          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/profile')}
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Bottom Row - Greeting and Profile */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
          <User className="w-6 h-6 text-primary" />
        </div>
        
        <div className="flex-1">
          <p className="text-sm text-gray-600">
            {getGreeting()}, {getFarmerName()}! 🙏
          </p>
          <p className="text-xs text-gray-500">
            {t('dashboard.welcomeMessage', 'Welcome back to your dashboard')}
          </p>
        </div>
      </div>
    </div>
  );
};
