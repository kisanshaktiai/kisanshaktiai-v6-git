
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, MapPin, Loader, Globe, WifiOff } from 'lucide-react';
import { useBranding } from '@/contexts/BrandingContext';
import { localStorageService } from '@/services/storage/localStorageService';
import { useNetworkState } from '@/hooks/useNetworkState';
import { offlineSyncManager } from '@/services/sync/offlineSyncManager';

interface EnhancedLanguageScreenProps {
  onNext: () => void;
}

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  isRegional?: boolean;
}

// State to language mapping for Indian states
const stateLanguageMap: Record<string, string[]> = {
  'Maharashtra': ['mr', 'hi', 'en'],
  'Karnataka': ['kn', 'en', 'hi'],
  'Tamil Nadu': ['ta', 'en', 'hi'],
  'Gujarat': ['gu', 'hi', 'en'],
  'Punjab': ['pa', 'hi', 'en'],
  'West Bengal': ['bn', 'hi', 'en'],
  'Andhra Pradesh': ['te', 'hi', 'en'],
  'Telangana': ['te', 'hi', 'en'],
  'Kerala': ['ml', 'hi', 'en'],
  'Odisha': ['or', 'hi', 'en'],
  'Uttar Pradesh': ['hi', 'ur', 'en'],
  'Bihar': ['hi', 'ur', 'en'],
  'Rajasthan': ['hi', 'ur', 'en'],
  'Madhya Pradesh': ['hi', 'en'],
  'Haryana': ['hi', 'pa', 'en'],
  'Jharkhand': ['hi', 'en'],
  'Chhattisgarh': ['hi', 'en'],
  'Assam': ['hi', 'en'],
  'Himachal Pradesh': ['hi', 'en'],
  'Uttarakhand': ['hi', 'en']
};

const allLanguages: Language[] = [
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  { code: 'ur', name: 'Urdu', nativeName: 'اُردُو', flag: '🇮🇳' }
];

export const EnhancedLanguageScreen: React.FC<EnhancedLanguageScreenProps> = ({ onNext }) => {
  const { t, i18n } = useTranslation();
  const { branding } = useBranding();
  const { isOnline } = useNetworkState();
  const [selectedLanguage, setSelectedLanguage] = useState<string>('hi');
  const [location, setLocation] = useState<string>('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [orderedLanguages, setOrderedLanguages] = useState<Language[]>(allLanguages);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    requestLocationAndOrderLanguages();
  }, []);

  const requestLocationAndOrderLanguages = async () => {
    setLocationLoading(true);
    
    try {
      if ('geolocation' in navigator) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            enableHighAccuracy: false
          });
        });
        
        // Get location name from coordinates (using reverse geocoding)
        const locationName = await getLocationFromCoordinates(
          position.coords.latitude, 
          position.coords.longitude
        );
        
        setLocation(locationName);
        orderLanguagesByLocation(locationName);
      } else {
        // Fallback: use default language order
        orderLanguagesByLocation('');
      }
    } catch (error) {
      console.log('Location access denied or failed:', error);
      // Use default language order
      orderLanguagesByLocation('');
    } finally {
      setLocationLoading(false);
    }
  };

  const getLocationFromCoordinates = async (lat: number, lon: number): Promise<string> => {
    if (!isOnline) return '';
    
    try {
      // Use a free geocoding service or your preferred API
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
      );
      const data = await response.json();
      return data.principalSubdivision || data.locality || '';
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return '';
    }
  };

  const orderLanguagesByLocation = (detectedLocation: string) => {
    let preferredOrder: string[] = ['hi', 'en']; // Default order
    
    // Find matching state and get preferred language order
    const matchingState = Object.keys(stateLanguageMap).find(state => 
      detectedLocation.toLowerCase().includes(state.toLowerCase())
    );
    
    if (matchingState) {
      preferredOrder = stateLanguageMap[matchingState];
    }
    
    // Reorder languages based on preference
    const orderedLanguages = [...allLanguages];
    orderedLanguages.sort((a, b) => {
      const aIndex = preferredOrder.indexOf(a.code);
      const bIndex = preferredOrder.indexOf(b.code);
      
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return 0;
    });
    
    // Mark regional languages
    orderedLanguages.forEach(lang => {
      lang.isRegional = preferredOrder.slice(0, 2).includes(lang.code);
    });
    
    setOrderedLanguages(orderedLanguages);
    
    // Set the first preferred language as default
    if (preferredOrder.length > 0) {
      setSelectedLanguage(preferredOrder[0]);
    }
  };

  const handleLanguageSelect = async (languageCode: string) => {
    setSelectedLanguage(languageCode);
    setSaving(true);
    
    try {
      // Apply language immediately
      await i18n.changeLanguage(languageCode);
      
      // Cache language preference immediately
      localStorageService.setCacheWithTTL('user_language_preference', languageCode, 43200); // 30 days
      
      // Queue for database sync when user is authenticated
      if (isOnline) {
        await offlineSyncManager.queueOperation({
          type: 'update',
          table: 'user_profiles',
          data: {
            language_preference: languageCode,
            updated_at: new Date().toISOString()
          },
          priority: 'high'
        });
      }
      
      // Visual feedback
      setTimeout(() => {
        setSaving(false);
      }, 500);
      
    } catch (error) {
      console.error('Error saving language preference:', error);
      setSaving(false);
    }
  };

  const handleContinue = () => {
    // Language is already saved, just continue
    onNext();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 text-center py-8">
          {/* Offline Indicator */}
          {!isOnline && (
            <div className="absolute top-4 right-4 bg-red-50 border border-red-200 rounded-full p-2">
              <WifiOff className="w-4 h-4 text-red-600" />
            </div>
          )}
          
          <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
            <Globe className="w-8 h-8 text-primary" />
          </div>
          
          <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
            {t('onboarding.select_language')}
          </CardTitle>
          
          <p className="text-gray-600 text-sm">
            {t('onboarding.language_subtitle')}
          </p>
          
          {/* Location Info */}
          {locationLoading ? (
            <div className="flex items-center justify-center space-x-2 mt-4 text-sm text-gray-500">
              <Loader className="w-4 h-4 animate-spin" />
              <span>{t('onboarding.detecting_location')}</span>
            </div>
          ) : location ? (
            <div className="flex items-center justify-center space-x-2 mt-4 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{location}</span>
            </div>
          ) : null}
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="space-y-3 mb-6">
            {orderedLanguages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageSelect(language.code)}
                disabled={saving}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left group hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedLanguage === language.code
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{language.flag}</span>
                    <div>
                      <div className="font-semibold text-gray-900 flex items-center space-x-2">
                        <span>{language.nativeName}</span>
                        {language.isRegional && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            {t('onboarding.regional')}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">{language.name}</div>
                    </div>
                  </div>
                  
                  {selectedLanguage === language.code && (
                    <div className="flex items-center space-x-2">
                      {saving ? (
                        <Loader className="w-5 h-5 animate-spin text-primary" />
                      ) : (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
          
          <Button
            onClick={handleContinue}
            disabled={saving}
            className="w-full h-12 text-base font-semibold rounded-xl transition-all duration-300 hover:scale-105"
            style={{ backgroundColor: branding.primaryColor }}
          >
            {saving ? (
              <div className="flex items-center space-x-2">
                <Loader className="w-4 h-4 animate-spin" />
                <span>{t('common.saving')}</span>
              </div>
            ) : (
              t('common.continue')
            )}
          </Button>
          
          <p className="text-xs text-center text-gray-500 mt-4">
            {t('onboarding.language_change_later')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
