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
        // 1. Get location
        const locationData = await LocationService.getLocationInfo();
        setLocation({
          city: locationData?.city || null,
          country: locationData?.country || null,
        });

        // 2. Get recommended languages
        const languageData = await LanguageService.getRecommendedLanguages(
          locationData?.countryCode
        );
        setRecommendedLanguages(languageData);
      } catch (err: any) {
        console.error('Error during language screen load:', err);
        setError(t('onboarding.languageError', 'Failed to determine language'));
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
        variant: 'warning',
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

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="grid gap-4">
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

            <div>
              <h3 className="text-md font-semibold mb-2">{t('onboarding.recommendedLanguages', 'Recommended Languages')}</h3>
              <div className="grid grid-cols-2 gap-2">
                {recommendedLanguages.map((lang) => (
                  <Button
                    key={lang}
                    variant={selectedLanguage === lang ? 'secondary' : 'outline'}
                    className="justify-start text-sm"
                    onClick={() => handleLanguageSelect(lang)}
                  >
                    {t(`languages.${lang}`)}
                    {selectedLanguage === lang && <Check className="w-4 h-4 ml-auto" />}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-md font-semibold mb-2">{t('onboarding.allLanguages', 'All Languages')}</h3>
              <div className="grid grid-cols-2 gap-2">
                {i18n.languages.map((lang) => (
                  <Button
                    key={lang}
                    variant={selectedLanguage === lang ? 'secondary' : 'outline'}
                    className="justify-start text-sm"
                    onClick={() => handleLanguageSelect(lang)}
                  >
                    {t(`languages.${lang}`)}
                    {selectedLanguage === lang && <Check className="w-4 h-4 ml-auto" />}
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
