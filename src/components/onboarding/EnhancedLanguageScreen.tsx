
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, Globe, Check } from 'lucide-react';
import { LocationService } from '@/services/LocationService';

interface EnhancedLanguageScreenProps {
  onNext: (language: string) => void;
}

const languages = [
  { code: 'hi', name: 'हिन्दी', nativeName: 'हिन्दी' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'mr', name: 'मराठी', nativeName: 'मराठी' },
  { code: 'gu', name: 'ગુજરાતી', nativeName: 'ગુજરાતી' },
  { code: 'te', name: 'తెలుగు', nativeName: 'తెలుగు' },
  { code: 'ta', name: 'தமிழ்', nativeName: 'தமிழ்' },
  { code: 'kn', name: 'ಕನ್ನಡ', nativeName: 'ಕನ್ನಡ' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'bn', name: 'বাংলা', nativeName: 'বাংলা' },
  { code: 'or', name: 'ଓଡ଼ିଆ', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'ml', name: 'മലയാളം', nativeName: 'മലയാളം' },
  { code: 'ur', name: 'اردو', nativeName: 'اردو' },
  { code: 'ne', name: 'नेपाली', nativeName: 'नेपाली' }
];

const EnhancedLanguageScreen: React.FC<EnhancedLanguageScreenProps> = ({ onNext }) => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('hi');
  const [location, setLocation] = useState<string>('');

  useEffect(() => {
    const detectLocation = async () => {
      try {
        const locationService = LocationService.getInstance();
        const coords = await locationService.getCurrentLocation();
        const address = await locationService.reverseGeocode(coords.latitude, coords.longitude);
        setLocation(`${address.district}, ${address.state}`);
      } catch (error) {
        console.warn('Location detection failed:', error);
        setLocation('India');
      }
    };

    detectLocation();
  }, []);

  const handleLanguageSelect = (langCode: string) => {
    setSelectedLanguage(langCode);
  };

  const handleContinue = () => {
    onNext(selectedLanguage);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Globe className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Choose Your Language
          </h1>
          <p className="text-gray-600">
            Select your preferred language for the best experience
          </p>
          {location && (
            <p className="text-sm text-gray-500 mt-2">
              📍 Detected location: {location}
            </p>
          )}
        </div>

        <div className="space-y-3 mb-8">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageSelect(lang.code)}
              className={`w-full p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between ${
                selectedLanguage === lang.code
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="font-medium">{lang.nativeName}</span>
                <span className="text-sm text-gray-500">({lang.name})</span>
              </div>
              {selectedLanguage === lang.code && (
                <Check className="w-5 h-5" />
              )}
            </button>
          ))}
        </div>

        <Button 
          onClick={handleContinue}
          className="w-full h-12 text-lg font-semibold"
          disabled={!selectedLanguage}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default EnhancedLanguageScreen;
