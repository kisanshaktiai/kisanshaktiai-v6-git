
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useUnifiedTenantData } from '@/hooks';
import { LocationService } from '@/services/LocationService';
import { LanguageService } from '@/services/LanguageService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Globe, MapPin, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface EnhancedLanguageScreenProps {
  onNext: (language: string) => void;
}

export const EnhancedLanguageScreen: React.FC<EnhancedLanguageScreenProps> = ({ onNext }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { currentTenant } = useSelector((state: RootState) => state.auth);
  const { branding } = useUnifiedTenantData(currentTenant);
  
  const [location, setLocation] = useState<{ city: string | null; country: string | null }>({
    city: null,
    country: null,
  });
  const [recommendedLanguages, setRecommendedLanguages] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // 1. Get location using available LocationService methods
        const locationService = LocationService.getInstance();
        const coordinates = await locationService.getCurrentLocation();
        const locationData = await locationService.reverseGeocode(
          coordinates.latitude, 
          coordinates.longitude
        );
        
        setLocation({
          city: locationData?.district || null,
          country: locationData?.state || null,
        });

        // 2. Get recommended languages based on location (simplified approach)
        const stateLanguageMap: Record<string, string[]> = {
          'Andhra Pradesh': ['te', 'en'],
          'Telangana': ['te', 'en'],
          'Tamil Nadu': ['ta', 'en'],
          'Karnataka': ['kn', 'en'],
          'Kerala': ['ml', 'en'],
          'Maharashtra': ['mr', 'en'],
          'Gujarat': ['gu', 'en'],
          'Punjab': ['pa', 'en'],
          'West Bengal': ['bn', 'en'],
          'Odisha': ['or', 'en'],
          'Uttar Pradesh': ['hi', 'en'],
          'Madhya Pradesh': ['hi', 'en'],
          'Rajasthan': ['hi', 'en'],
          'Bihar': ['hi', 'en'],
          'Jharkhand': ['hi', 'en'],
          'Chhattisgarh': ['hi', 'en'],
          'Haryana': ['hi', 'en'],
          'Delhi': ['hi', 'en'],
        };
        
        const stateLangs = stateLanguageMap[locationData?.state || ''] || ['hi', 'en'];
        setRecommendedLanguages(stateLangs);
        
      } catch (err: any) {
        console.error('Error during language screen load:', err);
        setError(t('onboarding.languageError', 'Failed to determine language'));
        // Set default recommendations on error
        setRecommendedLanguages(['hi', 'en']);
        toast({
          title: t('common.error'),
          description: t('onboarding.languageError', 'Failed to determine language'),
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [t]);

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
  };

  const handleNext = () => {
    if (!selectedLanguage) {
      toast({
        title: t('common.warning'),
        description: t('onboarding.selectLanguage', 'Please select a language'),
        variant: 'destructive',
      });
      return;
    }

    i18n.changeLanguage(selectedLanguage)
      .then(() => {
        onNext(selectedLanguage);
      })
      .catch((err) => {
        console.error('Error changing language:', err);
        toast({
          title: t('common.error'),
          description: t('onboarding.languageChangeError', 'Failed to change language'),
          variant: 'destructive',
        });
      });
  };

  // Available languages with their display names
  const availableLanguages = [
    { code: 'hi', name: 'हिंदी', nativeName: 'Hindi' },
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'te', name: 'తెలుగు', nativeName: 'Telugu' },
    { code: 'ta', name: 'தமிழ்', nativeName: 'Tamil' },
    { code: 'kn', name: 'ಕನ್ನಡ', nativeName: 'Kannada' },
    { code: 'ml', name: 'മലയാളം', nativeName: 'Malayalam' },
    { code: 'mr', name: 'मराठी', nativeName: 'Marathi' },
    { code: 'gu', name: '�gujarātī', nativeName: 'Gujarati' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ', nativeName: 'Punjabi' },
    { code: 'bn', name: 'বাংলা', nativeName: 'Bengali' },
    { code: 'or', name: 'ଓଡ଼ିଆ', nativeName: 'Odia' },
    { code: 'ur', name: 'اردو', nativeName: 'Urdu' },
  ];

  const recommendedLanguageItems = availableLanguages.filter(lang => 
    recommendedLanguages.includes(lang.code)
  );

  const otherLanguageItems = availableLanguages.filter(lang => 
    !recommendedLanguages.includes(lang.code)
  );

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="grid gap-4 p-6">
        <div className="text-center">
          <Globe className="w-10 h-10 mx-auto text-gray-500 mb-2" />
          <h2 className="text-lg font-semibold">{t('onboarding.languagePreferences', 'Language Preferences')}</h2>
          <p className="text-sm text-gray-500">
            {t('onboarding.selectPreferredLanguage', 'Select the language you prefer to use in the app.')}
          </p>
        </div>

        {isLoading && (
          <div className="text-center">
            <p>{t('common.loading')}...</p>
          </div>
        )}

        {error && (
          <div className="text-center text-red-500">
            <p>{error}</p>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {location.city && location.country && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>
                  {t('onboarding.locationDetected', 'Location Detected')}: {location.city}, {location.country}
                </span>
              </div>
            )}

            {recommendedLanguageItems.length > 0 && (
              <div>
                <h3 className="text-md font-semibold mb-2">{t('onboarding.recommendedLanguages', 'Recommended Languages')}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {recommendedLanguageItems.map((lang) => (
                    <Button
                      key={lang.code}
                      variant={selectedLanguage === lang.code ? 'secondary' : 'outline'}
                      className="justify-start text-sm p-3 h-auto"
                      onClick={() => handleLanguageSelect(lang.code)}
                    >
                      <div className="flex flex-col items-start text-left">
                        <span className="font-medium">{lang.name}</span>
                        <span className="text-xs text-muted-foreground">{lang.nativeName}</span>
                      </div>
                      {selectedLanguage === lang.code && <Check className="w-4 h-4 ml-auto" />}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-md font-semibold mb-2">{t('onboarding.allLanguages', 'All Languages')}</h3>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {otherLanguageItems.map((lang) => (
                  <Button
                    key={lang.code}
                    variant={selectedLanguage === lang.code ? 'secondary' : 'outline'}
                    className="justify-start text-sm p-3 h-auto"
                    onClick={() => handleLanguageSelect(lang.code)}
                  >
                    <div className="flex flex-col items-start text-left">
                      <span className="font-medium">{lang.name}</span>
                      <span className="text-xs text-muted-foreground">{lang.nativeName}</span>
                    </div>
                    {selectedLanguage === lang.code && <Check className="w-4 h-4 ml-auto" />}
                  </Button>
                ))}
              </div>
            </div>

            <Button onClick={handleNext} disabled={!selectedLanguage} className="w-full">
              {t('common.next')}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
