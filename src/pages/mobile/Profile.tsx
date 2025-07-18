import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { User, Settings, Globe, Bell, LogOut, Edit, Save, X } from 'lucide-react';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { LanguageService } from '@/services/LanguageService';
import { customAuthService } from '@/services/customAuthService';
import { toast } from 'sonner';

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' }
] as const;

type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]['code'];

export const Profile: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { farmer } = useCustomAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('en');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [editedProfile, setEditedProfile] = useState({
    mobile_number: '',
  });

  useEffect(() => {
    const currentLang = i18n.language as SupportedLanguage;
    if (SUPPORTED_LANGUAGES.some(lang => lang.code === currentLang)) {
      setSelectedLanguage(currentLang);
    }
  }, [i18n.language]);

  useEffect(() => {
    if (farmer) {
      setEditedProfile({
        mobile_number: farmer.mobile_number || '',
      });
    }
  }, [farmer]);

  const handleLanguageChange = async (languageCode: SupportedLanguage) => {
    try {
      setSelectedLanguage(languageCode);
      await LanguageService.getInstance().changeLanguage(languageCode);
      toast.success(t('profile.languageChanged'));
    } catch (error) {
      console.error('Error changing language:', error);
      toast.error(t('profile.languageChangeError'));
    }
  };

  const handleSaveProfile = () => {
    // TODO: Implement profile update logic
    setIsEditing(false);
    toast.success(t('profile.profileUpdated'));
  };

  const handleLogout = async () => {
    try {
      await customAuthService.signOut();
      toast.success(t('profile.loggedOut'));
    } catch (error) {
      console.error('Logout error:', error);
      toast.error(t('profile.logoutError'));
    }
  };

  if (!farmer) {
    return (
      <div className="p-4">
        <div className="text-center text-gray-500">
          {t('profile.loadingProfile')}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{farmer.farmer_code}</CardTitle>
              <p className="text-sm text-gray-600">{farmer.mobile_number}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
          </Button>
        </CardHeader>

        {isEditing && (
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="mobile">{t('profile.mobileNumber')}</Label>
              <Input
                id="mobile"
                value={editedProfile.mobile_number}
                onChange={(e) => setEditedProfile(prev => ({ ...prev, mobile_number: e.target.value }))}
                placeholder={t('profile.enterMobile')}
              />
            </div>
            <Button onClick={handleSaveProfile} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              {t('profile.saveChanges')}
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            {t('profile.settings')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Language Selection */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-gray-500" />
              <span>{t('profile.language')}</span>
            </div>
            <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.nativeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-gray-500" />
              <span>{t('profile.notifications')}</span>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <Card>
        <CardContent className="pt-6">
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t('profile.logout')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
