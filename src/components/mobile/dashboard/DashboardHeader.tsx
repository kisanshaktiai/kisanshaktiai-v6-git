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
  MapPin, 
  Calendar,
  AlertTriangle,
  TrendingUp,
  MessageSquare
} from 'lucide-react';

export const DashboardHeader: React.FC = () => {
  const { t } = useTranslation();
  const { profile, location } = useSelector((state: RootState) => state.farmer);
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

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
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
      {/* Professional Header with Glassmorphism */}
      <div 
        className="relative px-4 py-4 backdrop-blur-xl bg-gradient-to-br from-white/90 to-white/70 border-b border-white/20 safe-area-top"
        style={{
          background: tenantBranding?.primary_color 
            ? `linear-gradient(135deg, ${tenantBranding.background_color || '#ffffff'}f0, ${tenantBranding.primary_color}20, ${tenantBranding.accent_color || tenantBranding.primary_color}10)`
            : 'linear-gradient(135deg, #ffffff90, #f0f9ff80, #e0f2fe70)'
        }}
      >
        {/* Floating Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-green-200/30 to-blue-200/30 rounded-full blur-xl animate-float"></div>
          <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-gradient-to-br from-yellow-200/30 to-orange-200/30 rounded-full blur-lg animate-float" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Header Content */}
        <div className="relative z-10 space-y-3">
          {/* Top Row - Brand, Status, Time, and Actions */}
          <div className="flex items-center justify-between">
            {/* Brand and Status */}
            <div className="flex items-center space-x-3">
              {tenantBranding?.logo_url && (
                <div className="relative">
                  <img 
                    src={tenantBranding.logo_url} 
                    alt={tenantBranding.app_name || 'Logo'}
                    className="w-8 h-8 rounded-lg shadow-md ring-2 ring-white/50 object-cover"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                  {tenantBranding?.app_name || currentTenant?.name || 'KisanShakti AI'}
                </h1>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={isOnline ? 'default' : 'secondary'} 
                    className={`text-xs px-2 py-0.5 rounded-full font-medium shadow-sm ${
                      isOnline ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}
                  >
                    {isOnline ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
                    {isOnline ? 'Online' : 'Offline'}
                  </Badge>
                  <span className="text-xs text-gray-500">{getCurrentTime()}</span>
                </div>
              </div>
            </div>

            {/* Notifications and Menu */}
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative bg-white/50 backdrop-blur-sm border border-white/30 shadow-lg hover:bg-white/70 hover:shadow-xl transition-all duration-300"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    <span className="text-xs text-white font-bold">{notifications.length}</span>
                  </div>
                )}
              </Button>
              
              <HamburgerMenu />
            </div>
          </div>

          {/* Compact Welcome Section */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-1">
                <span className="text-sm text-gray-700">
                  {t('dashboard.goodMorning', 'Good morning')}, 
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {getProfileName()}
                </span>
                <span className="text-sm">👋</span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-gray-500 mt-0.5">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{getCurrentDate()}</span>
                </div>
                {location && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate max-w-24">
                      {location.address || `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Panel */}
      {showNotifications && (
        <div className="absolute top-full left-0 right-0 z-50 mx-4 mt-2">
          <Card className="bg-white/95 backdrop-blur-xl border-white/30 shadow-2xl">
            <CardContent className="p-0">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowNotifications(false)}>
                    ×
                  </Button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notification) => {
                  const Icon = notification.icon;
                  return (
                    <div key={notification.id} className="p-4 border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getPriorityColor(notification.priority)}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {notification.title}
                            </p>
                            <span className="text-xs text-gray-500">{notification.time}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
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
