
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useUnifiedTenantData } from '@/hooks';
import { LocationService } from '@/services/LocationService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Globe, ChevronRight, Loader2, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface LocationBasedLanguageScreenProps {
  onNext: (language: string) => void;
  onSkip?: () => void;
}

interface LocationInfo {
  state: string;
  district: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface LanguageRecommendation {
  code: string;
  name: string;
  nativeName: string;
  confidence: number;
  isRecommended: boolean;
}

export const LocationBasedLanguageScreen: React.FC<LocationBasedLanguageScreenProps> = ({ 
  onNext, 
  onSkip 
}) => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const { currentTenant } = useSelector((state: RootState) => state.auth);
  const { branding } = useUnifiedTenantData(currentTenant);
  
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [languageRecommendations, setLanguageRecommendations] = useState<LanguageRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLocationAndLanguages = async () => {
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
        
        const location: LocationInfo = {
          state: locationData.state,
          district: locationData.district,
          coordinates: {
            lat: coordinates.latitude,
            lng: coordinates.longitude,
          }
        };
        
        setLocationInfo(location);

        // 2. Get language recommendations based on state (simplified mapping)
        const stateLanguageMap: Record<string, LanguageRecommendation[]> = {
          'Andhra Pradesh': [
            { code: 'te', name: 'తెలుగు', nativeName: 'Telugu', confidence: 0.9, isRecommended: true },
            { code: 'en', name: 'English', nativeName: 'English', confidence: 0.7, isRecommended: true }
          ],
          'Telangana': [
            { code: 'te', name: 'తెలుగు', nativeName: 'Telugu', confidence: 0.9, isRecommended: true },
            { code: 'en', name: 'English', nativeName: 'English', confidence: 0.7, isRecommended: true }
          ],
          'Tamil Nadu': [
            { code: 'ta', name: 'தமிழ்', nativeName: 'Tamil', confidence: 0.9, isRecommended: true },
            { code: 'en', name: 'English', nativeName: 'English', confidence: 0.7, isRecommended: true }
          ],
          'Karnataka': [
            { code: 'kn', name: 'ಕನ್ನಡ', nativeName: 'Kannada', confidence: 0.9, isRecommended: true },
            { code: 'en', name: 'English', nativeName: 'English', confidence: 0.7, isRecommended: true }
          ],
          'Kerala': [
            { code: 'ml', name: 'മലയാളം', nativeName: 'Malayalam', confidence: 0.9, isRecommended: true },
            { code: 'en', name: 'English', nativeName: 'English', confidence: 0.7, isRecommended: true }
          ],
          'Maharashtra': [
            { code: 'mr', name: 'मराठी', nativeName: 'Marathi', confidence: 0.9, isRecommended: true },
            { code: 'en', name: 'English', nativeName: 'English', confidence: 0.7, isRecommended: true }
          ],
          'Gujarat': [
            { code: 'gu', name: 'ગુજરાતી', nativeName: 'Gujarati', confidence: 0.9, isRecommended: true },
            { code: 'en', name: 'English', nativeName: 'English', confidence: 0.7, isRecommended: true }
          ],
          'Punjab': [
            { code: 'pa', name: 'ਪੰਜਾਬੀ', nativeName: 'Punjabi', confidence: 0.9, isRecommended: true },
            { code: 'en', name: 'English', nativeName: 'English', confidence: 0.7, isRecommended: true }
          ],
          'West Bengal': [
            { code: 'bn', name: 'বাংলা', nativeName: 'Bengali', confidence: 0.9, isRecommended: true },
            { code: 'en', name: 'English', nativeName: 'English', confidence: 0.7, isRecommended: true }
          ],
          'Odisha': [
            { code: 'or', name: 'ଓଡ଼ିଆ', nativeName: 'Odia', confidence: 0.9, isRecommended: true },
            { code: 'en', name: 'English', nativeName: 'English', confidence: 0.7, isRecommended: true }
          ]
        };
        
        const recommendations = stateLanguageMap[locationData.state] || [
          { code: 'hi', name: 'हिंदी', nativeName: 'Hindi', confidence: 0.8, isRecommended: true },
          { code: 'en', name: 'English', nativeName: 'English', confidence: 0.7, isRecommended: true }
        ];
        
        setLanguageRecommendations(recommendations);
        
      } catch (err: any) {
        console.error('Error loading location and languages:', err);
        setError(t('location.errorLoading'));
        // Set default recommendations on error
        setLanguageRecommendations([
          { code: 'hi', name: 'हिंदी', nativeName: 'Hindi', confidence: 0.8, isRecommended: true },
          { code: 'en', name: 'English', nativeName: 'English', confidence: 0.7, isRecommended: true }
        ]);
        toast({
          title: t('common.error'),
          description: t('location.errorLoading'),
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadLocationAndLanguages();
  }, [t]);

  const handleLanguageSelect = (languageCode: string) => {
    setSelectedLanguage(languageCode);
  };

  const handleNext = () => {
    if (selectedLanguage) {
      i18n.changeLanguage(selectedLanguage)
        .then(() => {
          onNext(selectedLanguage);
        })
        .catch(err => {
          console.error('Error changing language:', err);
          toast({
            title: t('common.error'),
            description: t('language.errorChanging'),
            variant: 'destructive',
          });
        });
    } else {
      toast({
        title: t('common.warning'),
        description: t('language.selectLanguage'),
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <MapPin className="mr-2 h-5 w-5 text-muted-foreground" />
          {t('location.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{t('location.detecting')}</span>
          </div>
        ) : error ? (
          <div className="text-sm text-red-500">{error}</div>
        ) : (
          <>
            {locationInfo && (
              <div className="space-y-1">
                <p className="text-sm font-medium">{t('location.detected')}</p>
                <p className="text-sm text-muted-foreground">
                  {locationInfo.district}, {locationInfo.state}
                </p>
              </div>
            )}

            {languageRecommendations.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">{t('language.recommendations')}</p>
                <div className="grid grid-cols-2 gap-2">
                  {languageRecommendations.map((lang) => (
                    <Button
                      key={lang.code}
                      variant={selectedLanguage === lang.code ? 'secondary' : 'outline'}
                      className="justify-start text-sm p-3 h-auto"
                      onClick={() => handleLanguageSelect(lang.code)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex flex-col items-start text-left">
                          <span className="font-medium">{lang.name}</span>
                          <span className="text-xs text-muted-foreground">{lang.nativeName}</span>
                        </div>
                        {selectedLanguage === lang.code && (
                          <Check className="h-4 w-4 ml-2 text-green-500" />
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                {t('language.noRecommendations')}
              </div>
            )}
          </>
        )}

        <div className="flex justify-between">
          {onSkip && (
            <Button type="button" variant="ghost" size="sm" onClick={onSkip}>
              {t('common.skip')}
            </Button>
          )}
          <Button size="sm" onClick={handleNext} disabled={isLoading}>
            {t('common.next')}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
