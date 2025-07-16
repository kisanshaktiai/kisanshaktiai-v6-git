
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { logout } from '@/store/slices/authSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  User, 
  Phone, 
  MapPin, 
  Languages, 
  Settings, 
  LogOut,
  Shield,
  Bell
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { phoneNumber } = useSelector((state: RootState) => state.auth);
  const { profile, location, selectedLanguage } = useSelector((state: RootState) => state.farmer);

  const handleLogout = () => {
    dispatch(logout());
  };

  // Helper function to safely convert translation result to string
  const getTranslation = (key: string, fallback: string): string => {
    const result = t(key);
    if (typeof result === 'string') return result;
    return fallback;
  };

  // Helper function to get profile name as string
  const getProfileName = (): string => {
    if (!profile?.name) return getTranslation('common.farmer', 'Farmer');
    if (typeof profile.name === 'string') return profile.name;
    return profile.name.en || profile.name.hi || getTranslation('common.farmer', 'Farmer');
  };

  const menuItems = [
    {
      icon: Settings,
      title: t('profile.accountSettings'),
      subtitle: t('profile.accountSettingsDesc'),
    },
    {
      icon: Bell,
      title: t('profile.notifications'),
      subtitle: t('profile.notificationsDesc'),
    },
    {
      icon: Shield,
      title: t('profile.privacySecurity'),
      subtitle: t('profile.privacySecurityDesc'),
    },
    {
      icon: Languages,
      title: t('profile.language'),
      subtitle: t('profile.languageDesc'),
      value: selectedLanguage?.toUpperCase(),
    },
  ];

  return (
    <div className="p-4 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {getTranslation('profile.title', 'Profile')}
        </h1>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="p-6 text-center">
          <Avatar className="w-20 h-20 mx-auto mb-4">
            <AvatarFallback className="bg-green-100 text-green-800 text-xl">
              {getProfileName().charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            {getProfileName()}
          </h2>
          <p className="text-gray-600 mb-3">{phoneNumber}</p>
          <Badge variant="outline" className="mb-4">{t('profile.verifiedAccount')}</Badge>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-center space-x-1">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">
                {location?.district || t('profile.locationNotSet')}
              </span>
            </div>
            <div className="flex items-center justify-center space-x-1">
              <Languages className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">
                {selectedLanguage?.toUpperCase() || 'HI'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-xl font-bold text-green-600">2</div>
            <div className="text-xs text-gray-600">{t('profile.lands')}</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-xl font-bold text-blue-600">15</div>
            <div className="text-xs text-gray-600">{t('profile.aiChats')}</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-xl font-bold text-orange-600">7</div>
            <div className="text-xs text-gray-600">{t('profile.daysActive')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Menu Items */}
      <div className="space-y-3">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <Icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.subtitle}</p>
                  </div>
                  {item.value && (
                    <Badge variant="outline">{item.value}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Logout Button */}
      <Button 
        variant="outline" 
        onClick={handleLogout}
        className="w-full mt-6"
      >
        <LogOut className="w-4 h-4 mr-2" />
        {t('profile.logout')}
      </Button>
    </div>
  );
};
