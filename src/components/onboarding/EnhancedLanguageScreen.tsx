
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Globe, MapPin, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useBranding } from '@/contexts/BrandingContext';
import { LocationService } from '@/services/LocationService';
import { LanguageService } from '@/services/LanguageService';
import { localStorageService } from '@/services/storage/localStorageService';
import { useTranslation } from 'react-i18next';

export type LanguageCode = 'en' | 'hi' | 'mr' | 'pa' | 'gu' | 'te' | 'ta' | 'kn' | 'ml' | 'or' | 'bn' | 'ur' | 'ne';

interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
  region: string;
  speakers: string;
  flag: string;
  isRecommended?: boolean;
}

const languages: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', region: 'Global', speakers: '1.5B+', flag: '🇺🇸' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', region: 'North India', speakers: '600M+', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', region: 'Maharashtra', speakers: '83M+', flag: '🏛️' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', region: 'Punjab', speakers: '100M+', flag: '🌾' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', region: 'Gujarat', speakers: '56M+', flag: '🦁' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', region: 'Andhra Pradesh', speakers: '95M+', flag: '🎭' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', region: 'Tamil Nadu', speakers: '75M+', flag: '🏛️' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', region: 'Karnataka', speakers: '44M+', flag: '🌸' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', region: 'Kerala', speakers: '38M+', flag: '🌴' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', region: 'Odisha', speakers: '35M+', flag: '🏛️' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', region: 'West Bengal', speakers: '230M+', flag: '🐟' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', region: 'North India', speakers: '70M+', flag: '🕌' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', region: 'Nepal/Hills', speakers: '16M+', flag: '🏔️' }
];

interface EnhancedLanguageScreenProps {
  onLanguageSelect: (language: LanguageCode) => void;
}

export const EnhancedLanguageScreen: React.FC<EnhancedLanguageScreenProps> = ({ onLanguageSelect }) => {
  const { branding } = useBranding();
  const { i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('hi');
  const [location, setLocation] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [recommendedLanguages, setRecommendedLanguages] = useState<LanguageCode[]>(['hi', 'en']);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    detectLocationAndLanguage();
  }, []);

  const detectLocationAndLanguage = async () => {
    try {
      const locationData = await LocationService.getCurrentLocation();
      if (locationData) {
        setLocation(locationData.city || locationData.state || 'India');
        
        // Get language recommendations based on location
        const recommendations = getLanguageRecommendations(locationData.state || '');
        setRecommendedLanguages(recommendations);
        
        // Set default language based on location
        if (recommendations.length > 0) {
          setSelectedLanguage(recommendations[0]);
        }
      }
    } catch (error) {
      console.error('Error detecting location:', error);
      setLocation('India');
    }
  };

  const getLanguageRecommendations = (state: string): LanguageCode[] => {
    const stateLanguageMap: Record<string, LanguageCode[]> = {
      'Maharashtra': ['mr', 'hi', 'en'],
      'Gujarat': ['gu', 'hi', 'en'],
      'Punjab': ['pa', 'hi', 'en'],
      'Tamil Nadu': ['ta', 'en', 'hi'],
      'Karnataka': ['kn', 'en', 'hi'],
      'Kerala': ['ml', 'en', 'hi'],
      'Andhra Pradesh': ['te', 'en', 'hi'],
      'Telangana': ['te', 'en', 'hi'],
      'West Bengal': ['bn', 'hi', 'en'],
      'Odisha': ['or', 'hi', 'en'],
      'Uttar Pradesh': ['hi', 'ur', 'en'],
      'Bihar': ['hi', 'en'],
      'Rajasthan': ['hi', 'en'],
      'Madhya Pradesh': ['hi', 'en'],
      'Haryana': ['hi', 'pa', 'en'],
      'Jharkhand': ['hi', 'en'],
      'Chhattisgarh': ['hi', 'en'],
      'Assam': ['bn', 'hi', 'en'],
      'Himachal Pradesh': ['hi', 'pa', 'en'],
      'Uttarakhand': ['hi', 'en'],
      'Jammu and Kashmir': ['ur', 'hi', 'en'],
      'Goa': ['mr', 'hi', 'en'],
      'Manipur': ['hi', 'en'],
      'Meghalaya': ['en', 'hi'],
      'Mizoram': ['en', 'hi'],
      'Nagaland': ['en', 'hi'],
      'Sikkim': ['ne', 'hi', 'en'],
      'Tripura': ['bn', 'hi', 'en'],
      'Arunachal Pradesh': ['en', 'hi']
    };

    return stateLanguageMap[state] || ['hi', 'en'];
  };

  const handleLanguageSelect = async (language: LanguageCode) => {
    setSelectedLanguage(language);
    setError(null);
    setLoading(true);

    try {
      // Save language preference to localStorage
      localStorage.setItem('selectedLanguage', language);
      localStorage.setItem('languageSelectedAt', new Date().toISOString());
      
      // Try to change language using i18n - check if changeLanguage exists
      if (i18n && typeof i18n.changeLanguage === 'function') {
        await i18n.changeLanguage(language);
      }
      
      // Also save via LanguageService
      await LanguageService.getInstance().changeLanguage(language);
      
      // Store in cache
      localStorageService.setCacheWithTTL('user_language', language, 43200); // 30 days
      
      console.log('Language preference saved successfully:', language);
      
      // Call the callback
      onLanguageSelect(language);
      
    } catch (err) {
      console.error('Error saving language preference:', err);
      setError('Failed to save language preference. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDisplayLanguages = () => {
    if (showAll) {
      return languages.map(lang => ({
        ...lang,
        isRecommended: recommendedLanguages.includes(lang.code)
      }));
    }
    
    const recommended = languages.filter(lang => recommendedLanguages.includes(lang.code));
    const others = languages.filter(lang => !recommendedLanguages.includes(lang.code)).slice(0, 3);
    
    return [
      ...recommended.map(lang => ({ ...lang, isRecommended: true })),
      ...others.map(lang => ({ ...lang, isRecommended: false }))
    ];
  };

  const displayLanguages = getDisplayLanguages();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${branding.primaryColor}20` }}
                >
                  <Globe className="w-6 h-6" style={{ color: branding.primaryColor }} />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Choose Your Language
                </h1>
              </div>
              
              <p className="text-gray-600 text-lg">
                Select your preferred language for the best experience
              </p>
              
              {location && (
                <div className="flex items-center justify-center gap-2 mt-3 text-sm text-gray-500">
                  <MapPin className="w-4 h-4" />
                  <span>Detected location: {location}</span>
                </div>
              )}
            </div>

            {/* Language Options */}
            <div className="space-y-3 mb-6">
              {displayLanguages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageSelect(language.code)}
                  disabled={loading}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                    selectedLanguage === language.code
                      ? 'border-green-500 bg-green-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">{language.flag}</div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">
                            {language.name}
                          </span>
                          {language.isRecommended && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                              Recommended
                            </span>
                          )}
                        </div>
                        <div className="text-lg text-gray-600 mt-1">
                          {language.nativeName}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {language.region}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {language.speakers}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedLanguage === language.code && (
                        <Check className="w-6 h-6 text-green-600" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Show More/Less Button */}
            {!showAll && (
              <div className="text-center mb-6">
                <button
                  onClick={() => setShowAll(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Show all languages ({languages.length - displayLanguages.length} more)
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="text-red-600 text-center mb-4 p-3 bg-red-50 rounded-lg">
                {error}
              </div>
            )}

            {/* Continue Button */}
            <Button
              onClick={() => handleLanguageSelect(selectedLanguage)}
              disabled={loading}
              className="w-full py-4 text-lg font-semibold rounded-xl"
              style={{ backgroundColor: branding.primaryColor }}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </div>
              ) : (
                'Continue'
              )}
            </Button>

            {/* Info Footer */}
            <div className="mt-6 text-center text-sm text-gray-500">
              <div className="flex items-center justify-center gap-1">
                <Clock className="w-4 h-4" />
                <span>You can change this later in settings</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
