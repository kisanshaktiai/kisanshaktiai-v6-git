
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HamburgerMenu } from '../navigation/HamburgerMenu';
import { 
  Bell, 
  Wifi, 
  WifiOff,
  AlertTriangle,
  TrendingUp,
  MessageSquare
} from 'lucide-react';

export const DashboardHeader: React.FC = () => {
  const { t } = useTranslation();
  const { profile } = useSelector((state: RootState) => state.farmer);
  const { isOnline } = useSelector((state: RootState) => state.sync);
  const { currentTenant, tenantBranding } = useSelector((state: RootState) => state.tenant);
  const [showNotifications, setShowNotifications] = useState(false);

  // Mock notification data for professional look
  const notifications = [
    {
      id: 1,
      type: 'weather',
      icon: AlertTriangle,
      title: 'Weather Alert',
      message: 'Heavy rainfall expected tomorrow',
      priority: 'high',
      time: '2 min ago'
    },
    {
      id: 2,
      type: 'market',
      icon: TrendingUp,
      title: 'Price Update',
      message: 'Wheat prices increased by 5%',
      priority: 'medium',
      time: '1 hour ago'
    },
    {
      id: 3,
      type: 'message',
      icon: MessageSquare,
      title: 'AI Assistant',
      message: 'New farming recommendations available',
      priority: 'low',
      time: '3 hours ago'
    }
  ];

  const getProfileName = (): string => {
    if (!profile?.name) return t('common.farmer', 'Farmer');
    if (typeof profile.name === 'string') return profile.name;
    return profile.name.en || profile.name.hi || t('common.farmer', 'Farmer');
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <>
      {/* Compact Sticky Header */}
      <div 
        className="sticky top-0 z-50 px-4 py-2 backdrop-blur-xl bg-gradient-to-br from-white/95 to-white/85 border-b border-white/20 safe-area-top"
        style={{
          background: tenantBranding?.primary_color 
            ? `linear-gradient(135deg, ${tenantBranding.background_color || '#ffffff'}f5, ${tenantBranding.primary_color}15)`
            : 'linear-gradient(135deg, #ffffff95, #f0f9ff85)'
        }}
      >
        {/* Floating Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br from-green-200/20 to-blue-200/20 rounded-full blur-lg animate-float"></div>
          <div className="absolute -bottom-1 -left-1 w-8 h-8 bg-gradient-to-br from-yellow-200/20 to-orange-200/20 rounded-full blur-md animate-float" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Header Content */}
        <div className="relative z-10 flex items-center justify-between">
          {/* Brand, Status and Welcome */}
          <div className="flex items-center space-x-3 flex-1">
            {tenantBranding?.logo_url && (
              <div className="relative">
                <img 
                  src={tenantBranding.logo_url} 
                  alt={tenantBranding.app_name || 'Logo'}
                  className="w-7 h-7 rounded-md shadow-md ring-1 ring-white/50 object-cover"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border border-white rounded-full animate-pulse"></div>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2 mb-0.5">
                <h1 className="text-sm font-bold text-gray-900 tracking-tight truncate">
                  {tenantBranding?.app_name || currentTenant?.name || 'KisanShakti AI'}
                </h1>
                <Badge 
                  variant={isOnline ? 'default' : 'secondary'} 
                  className={`text-xs px-1.5 py-0.5 rounded-full font-medium shadow-sm ${
                    isOnline ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}
                >
                  {isOnline ? <Wifi className="w-2.5 h-2.5 mr-1" /> : <WifiOff className="w-2.5 h-2.5 mr-1" />}
                  {isOnline ? 'Live' : 'Offline'}
                </Badge>
              </div>
              <div className="flex items-center space-x-3 text-xs">
                <span className="text-gray-700 truncate">
                  {t('dashboard.hi', 'Hi')}, {getProfileName()} 👋
                </span>
                <span className="text-gray-500 font-mono">{getCurrentTime()}</span>
              </div>
            </div>
          </div>

          {/* Notifications and Menu */}
          <div className="flex items-center space-x-1.5">
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative bg-white/50 backdrop-blur-sm border border-white/30 shadow-md hover:bg-white/70 hover:shadow-lg transition-all duration-300 h-8 w-8 p-0"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-md animate-pulse">
                  <span className="text-xs text-white font-bold">{notifications.length}</span>
                </div>
              )}
            </Button>
            
            <HamburgerMenu />
          </div>
        </div>
      </div>

      {/* Notification Panel */}
      {showNotifications && (
        <div className="absolute top-full left-0 right-0 z-40 mx-4 mt-1">
          <Card className="bg-white/95 backdrop-blur-xl border-white/30 shadow-2xl">
            <CardContent className="p-0">
              <div className="p-3 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowNotifications(false)} className="h-6 w-6 p-0">
                    ×
                  </Button>
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.map((notification) => {
                  const Icon = notification.icon;
                  return (
                    <div key={notification.id} className="p-3 border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-start space-x-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${getPriorityColor(notification.priority)}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {notification.title}
                            </p>
                            <span className="text-xs text-gray-500 ml-2">{notification.time}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-0.5">{notification.message}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};
