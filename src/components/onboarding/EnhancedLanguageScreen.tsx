import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { setLanguage } from '@/store/slices/farmerSlice';
import { LanguageService } from '@/services/LanguageService';
import { LocationService } from '@/services/LocationService';
import { Globe, MapPin, Check, Loader, ChevronRight } from 'lucide-react';
import { RootState } from '@/store';

interface EnhancedLanguageScreenProps {
  onNext: () => void;
  onSkip?: () => void;
}

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  regions: string[];
}

export const EnhancedLanguageScreen: React.FC<EnhancedLanguageScreenProps> = ({ 
  onNext, 
  onSkip 
}) => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const { tenantBranding } = useSelector((state: RootState) => state.tenant);
  
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [autoDetecting, setAutoDetecting] = useState(true);
  const [detectedLocation, setDetectedLocation] = useState<string | null>(null);
  const [recommendedLanguages, setRecommendedLanguages] = useState<string[]>([]);
  
  const primaryColor = tenantBranding?.primary_color || '#10B981';
  const appName = tenantBranding?.app_name || 'KisanShakti AI';

  const languages: LanguageOption[] = [
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳', regions: ['UP', 'MP', 'RJ', 'HR', 'DL', 'UK', 'HP', 'JH', 'CG', 'BR'] },
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', regions: ['PAN'] },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳', regions: ['MH', 'GOA'] },
    { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳', regions: ['PB', 'HR', 'DL'] },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳', regions: ['AP', 'TS'] },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', regions: ['TN', 'PY'] },
    { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳', regions: ['GJ', 'DD', 'DNH'] },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳', regions: ['KA'] },
  ];

  // State code to language mapping
  const stateLanguageMap: Record<string, string[]> = {
    'Maharashtra': ['mr', 'hi', 'en'],
    'Gujarat': ['gu', 'hi', 'en'],
    'Punjab': ['pa', 'hi', 'en'],
    'Tamil Nadu': ['ta', 'en', 'hi'],
    'Karnataka': ['kn', 'en', 'hi'],
    'Andhra Pradesh': ['te', 'en', 'hi'],
    'Telangana': ['te', 'en', 'hi'],
    'Uttar Pradesh': ['hi', 'en'],
    'Madhya Pradesh': ['hi', 'en'],
    'Rajasthan': ['hi', 'en'],
    'Haryana': ['hi', 'pa', 'en'],
    'Delhi': ['hi', 'pa', 'en'],
  };

  useEffect(() => {
    detectLocationAndLanguage();
  }, []);

  const detectLocationAndLanguage = async () => {
    try {
      setAutoDetecting(true);
      
      // Try to get location
      const hasPermission = await LocationService.getInstance().requestPermissions();
      
      if (hasPermission) {
        const coords = await LocationService.getInstance().getCurrentLocation();
        const address = await LocationService.getInstance().reverseGeocode(
          coords.latitude,
          coords.longitude
        );
        
        setDetectedLocation(`${address.district}, ${address.state}`);
        
        // Get recommended languages based on state
        const stateLangs = stateLanguageMap[address.state] || ['hi', 'en'];
        setRecommendedLanguages(stateLangs);
        
        // Auto-select the primary language for the region
        const primaryLang = stateLangs[0];
        setSelectedLanguage(primaryLang);
        
        // Apply the language
        await LanguageService.getInstance().changeLanguage(primaryLang);
        dispatch(setLanguage(primaryLang));
        
        console.log('Location-based language detected:', primaryLang, 'for', address.state);
      } else {
        // Fallback to browser language detection
        const browserLang = navigator.language || navigator.languages?.[0] || 'en';
        const langCode = browserLang.split('-')[0];
        
        const supportedLang = languages.find(lang => lang.code === langCode);
        const fallbackLang = supportedLang ? langCode : 'hi';
        
        setSelectedLanguage(fallbackLang);
        setRecommendedLanguages([fallbackLang, 'en']);
        
        await LanguageService.getInstance().changeLanguage(fallbackLang);
        dispatch(setLanguage(fallbackLang));
      }
    } catch (error) {
      console.error('Language detection error:', error);
      // Default fallback
      setSelectedLanguage('hi');
      setRecommendedLanguages(['hi', 'en']);
      await LanguageService.getInstance().changeLanguage('hi');
      dispatch(setLanguage('hi'));
    } finally {
      setAutoDetecting(false);
    }
  };

  const handleLanguageSelect = async (languageCode: string) => {
    try {
      setSelectedLanguage(languageCode);
      await LanguageService.getInstance().changeLanguage(languageCode);
      dispatch(setLanguage(languageCode));
    } catch (error) {
      console.error('Language change error:', error);
    }
  };

  const handleContinue = () => {
    if (selectedLanguage) {
      onNext();
    }
  };

  if (autoDetecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg animate-pulse"
            style={{ backgroundColor: `${primaryColor}15`, border: `2px solid ${primaryColor}` }}
          >
            <MapPin className="w-10 h-10" style={{ color: primaryColor }} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('onboarding.detecting_language')}
          </h1>
          <p className="text-gray-600 text-base">
            {t('onboarding.location_language_subtitle')}
          </p>
          <div className="flex items-center justify-center space-x-2">
            <Loader className="w-5 h-5 animate-spin" style={{ color: primaryColor }} />
            <span className="text-sm text-gray-500">{t('common.please_wait')}</span>
          </div>
        </div>
      </div>
    );
  }

  const recommendedLangs = languages.filter(lang => recommendedLanguages.includes(lang.code));
  const otherLangs = languages.filter(lang => !recommendedLanguages.includes(lang.code));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-3">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg"
            style={{ backgroundColor: `${primaryColor}15`, border: `2px solid ${primaryColor}` }}
          >
            <Globe className="w-10 h-10" style={{ color: primaryColor }} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('onboarding.choose_language')}
          </h1>
          <p className="text-gray-600 text-base">
            {t('onboarding.language_description')}
          </p>
          {detectedLocation && (
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 bg-gray-100 rounded-lg p-2">
              <MapPin className="w-4 h-4" />
              <span>{t('onboarding.detected_location')}: {detectedLocation}</span>
            </div>
          )}
        </div>

        <div className="space-y-4 max-h-80 overflow-y-auto">
          {/* Recommended Languages */}
          {recommendedLangs.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-500 px-2">
                {t('onboarding.recommended_for_you')}
              </div>
              {recommendedLangs.map((language) => (
                <Button
                  key={language.code}
                  variant={selectedLanguage === language.code ? "default" : "outline"}
                  onClick={() => handleLanguageSelect(language.code)}
                  className={`w-full p-4 h-auto justify-between group hover:scale-[1.02] transition-all ${
                    selectedLanguage === language.code 
                      ? 'ring-2 shadow-lg' 
                      : 'hover:border-gray-300'
                  }`}
                  style={selectedLanguage === language.code ? {
                    backgroundColor: primaryColor,
                    borderColor: primaryColor
                  } : {}}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{language.flag}</span>
                    <div className="text-left">
                      <div className="font-semibold">{language.nativeName}</div>
                      <div className="text-sm opacity-75">{language.name}</div>
                    </div>
                  </div>
                  {selectedLanguage === language.code ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                  )}
                </Button>
              ))}
            </div>
          )}

          {/* Other Languages */}
          {otherLangs.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-500 px-2">
                {t('onboarding.other_languages')}
              </div>
              {otherLangs.map((language) => (
                <Button
                  key={language.code}
                  variant={selectedLanguage === language.code ? "default" : "outline"}
                  onClick={() => handleLanguageSelect(language.code)}
                  className={`w-full p-4 h-auto justify-between group hover:scale-[1.02] transition-all ${
                    selectedLanguage === language.code 
                      ? 'ring-2 shadow-lg' 
                      : 'hover:border-gray-300'
                  }`}
                  style={selectedLanguage === language.code ? {
                    backgroundColor: primaryColor,
                    borderColor: primaryColor
                  } : {}}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{language.flag}</span>
                    <div className="text-left">
                      <div className="font-semibold">{language.nativeName}</div>
                      <div className="text-sm opacity-75">{language.name}</div>
                    </div>
                  </div>
                  {selectedLanguage === language.code ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                  )}
                </Button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3 pt-4">
          <Button 
            onClick={handleContinue}
            disabled={!selectedLanguage}
            className="w-full h-14 text-lg font-semibold rounded-xl"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center space-x-2">
              <span>{t('common.continue')}</span>
              <ChevronRight className="w-5 h-5" />
            </div>
          </Button>

          {onSkip && (
            <Button 
              variant="ghost" 
              onClick={onSkip}
              className="w-full text-gray-600"
            >
              {t('onboarding.skip_for_now')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
