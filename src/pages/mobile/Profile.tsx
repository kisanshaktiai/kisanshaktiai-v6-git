
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { User, Settings, Globe, Bell, Edit, Save, X } from 'lucide-react';
import { useSimpleFarmer } from '@/hooks/useSimpleFarmer';
import { toast } from 'sonner';

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
] as const;

export const Profile: React.FC = () => {
  const { farmer } = useSimpleFarmer();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [editedProfile, setEditedProfile] = useState({
    mobile_number: farmer.mobile_number || '',
  });

  const handleLanguageChange = async (languageCode: string) => {
    setSelectedLanguage(languageCode);
    toast.success('Language changed successfully');
  };

  const handleSaveProfile = () => {
    setIsEditing(false);
    toast.success('Profile updated successfully');
  };

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
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                value={editedProfile.mobile_number}
                onChange={(e) => setEditedProfile(prev => ({ ...prev, mobile_number: e.target.value }))}
                placeholder="Enter mobile number"
              />
            </div>
            <Button onClick={handleSaveProfile} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Language Selection */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-gray-500" />
              <span>Language</span>
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
              <span>Notifications</span>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
