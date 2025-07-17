
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { logout } from '@/store/slices/authSlice';
import { useAuth } from '@/hooks/useAuth';
import { LanguageService } from '@/services/LanguageService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { 
  User, 
  Phone, 
  MapPin, 
  Languages, 
  Settings, 
  LogOut,
  Shield,
  Bell,
  Edit2,
  Check
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const { updateProfile } = useAuth();
  const { phoneNumber } = useSelector((state: RootState) => state.auth);
  const { profile, location } = useSelector((state: RootState) => state.farmer);
  
  // Get language preference from localStorage or default to Hindi
  const storedLanguage = localStorage.getItem('selectedLanguage') || 'hi';
  const [isEditingLanguage, setIsEditingLanguage] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(storedLanguage);
  const [updatingLanguage, setUpdatingLanguage] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
  };

  const languageService = LanguageService.getInstance();
  const supportedLanguages = languageService.getSupportedLanguages();

  const handleLanguageUpdate = async () => {
    if (selectedLanguage === storedLanguage) {
      setIsEditingLanguage(false);
      return;
    }

    setUpdatingLanguage(true);
    try {
      // Update language preference in profile
      await updateProfile({ preferred_language: selectedLanguage });
      
      // Apply language change
      await languageService.changeLanguage(selectedLanguage);
      
      // Store language selection
      localStorage.setItem('selectedLanguage', selectedLanguage);
      localStorage.setItem('languageSelectedAt', new Date().toISOString());
      
      toast({
        title: t('profile.languageUpdated'),
        description: t('profile.languageUpdatedDesc'),
      });
      
      setIsEditingLanguage(false);
    } catch (error) {
      console.error('Error updating language:', error);
      toast({
        title: t('profile.languageUpdateError'),
        description: t('profile.languageUpdateErrorDesc'),
        variant: 'destructive',
      });
    } finally {
      setUpdatingLanguage(false);
    }
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

  const getCurrentLanguageName = () => {
    const currentLang = selectedLanguage;
    const lang = supportedLanguages.find(l => l.code === currentLang);
    return lang ? lang.nativeName : 'हिंदी';
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
                {getCurrentLanguageName()}
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

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Languages className="w-5 h-5 mr-2 text-green-600" />
            {t('profile.languageSettings')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">{t('profile.preferredLanguage')}</h3>
              <p className="text-sm text-gray-600">{t('profile.preferredLanguageDesc')}</p>
            </div>
            {!isEditingLanguage ? (
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="px-3 py-1">
                  {getCurrentLanguageName()}
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsEditingLanguage(true)}
                  className="h-8 w-8 p-0"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Select 
                  value={selectedLanguage} 
                  onValueChange={setSelectedLanguage}
                  disabled={updatingLanguage}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedLanguages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.nativeName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleLanguageUpdate}
                  disabled={updatingLanguage}
                  className="h-8 w-8 p-0"
                >
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {t('profile.languageNote')}
          </div>
        </CardContent>
      </Card>

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
