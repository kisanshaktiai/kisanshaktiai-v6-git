
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LocationService } from '@/services/LocationService';
import { LanguageService } from '@/services/LanguageService';
import { MapPin, Globe, Loader } from 'lucide-react';

interface LocationBasedLanguageScreenProps {
  onNext: () => void;
}

// State to language mapping
const stateLanguageMapping: Record<string, string[]> = {
  'maharashtra': ['mr', 'hi', 'en'],
  'gujarat': ['gu', 'hi', 'en'],
  'punjab': ['pa', 'hi', 'en'],
  'haryana': ['pa', 'hi', 'en'],
  'tamil nadu': ['ta', 'hi', 'en'],
  'telangana': ['te', 'hi', 'en'],
  'andhra pradesh': ['te', 'hi', 'en'],
  'karnataka': ['kn', 'hi', 'en'],
  'kerala': ['ml', 'hi', 'en'],
  'odisha': ['or', 'hi', 'en'],
  'west bengal': ['bn', 'hi', 'en'],
  'default': ['hi', 'en', 'mr', 'pa', 'gu', 'te', 'ta', 'kn']
};

export const LocationBasedLanguageScreen: React.FC<LocationBasedLanguageScreenProps> = ({ onNext }) => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<string | null>(null);
  const [prioritizedLanguages, setPrioritizedLanguages] = useState<any[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('hi');

  const allLanguages = [
    { code: 'hi', name: 'हिंदी', nativeName: 'हिंदी' },
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
    { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
    { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  ];

  useEffect(() => {
    detectLocationAndPrioritizeLanguages();
  }, []);

  const detectLocationAndPrioritizeLanguages = async () => {
    try {
      setLoading(true);
      
      // Try to get device location
      const locationService = LocationService.getInstance();
      const hasPermission = await locationService.requestPermissions();
      
      if (hasPermission) {
        const coords = await locationService.getCurrentLocation();
        const address = await locationService.reverseGeocode(coords.latitude, coords.longitude);
        
        const stateName = address.state.toLowerCase();
        setLocation(`${address.district}, ${address.state}`);
        
        // Get prioritized languages based on state
        const languagePriority = stateLanguageMapping[stateName] || stateLanguageMapping['default'];
        
        // Arrange languages based on priority
        const prioritized = [];
        const remaining = [];
        
        languagePriority.forEach(langCode => {
          const lang = allLanguages.find(l => l.code === langCode);
          if (lang) prioritized.push(lang);
        });
        
        allLanguages.forEach(lang => {
          if (!prioritized.find(p => p.code === lang.code)) {
            remaining.push(lang);
          }
        });
        
        setPrioritizedLanguages([...prioritized, ...remaining]);
        setSelectedLanguage(prioritized[0]?.code || 'hi');
        
        console.log('Location detected:', address);
        console.log('Prioritized languages:', prioritized.map(l => l.name));
      } else {
        // No location permission, show default priority
        setPrioritizedLanguages(allLanguages);
        setSelectedLanguage('hi');
        setLocation('Location not available');
      }
    } catch (error) {
      console.error('Error detecting location:', error);
      // Fallback to default languages
      setPrioritizedLanguages(allLanguages);
      setSelectedLanguage('hi');
      setLocation('Location detection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageSelect = async (languageCode: string) => {
    try {
      setLoading(true);
      
      // Change language immediately
      await LanguageService.getInstance().changeLanguage(languageCode);
      await i18n.changeLanguage(languageCode);
      
      // Save preference locally for immediate use
      localStorage.setItem('selectedLanguage', languageCode);
      localStorage.setItem('languageSelectedAt', new Date().toISOString());
      
      console.log('Language selected:', languageCode);
      
      // Proceed to next step
      onNext();
    } catch (error) {
      console.error('Error setting language:', error);
      onNext(); // Proceed anyway
    } finally {
      setLoading(false);
    }
  };

  if (loading && prioritizedLanguages.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-6">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4 mx-auto">
              <Loader className="w-8 h-8 text-white animate-spin" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Detecting Location</h2>
            <p className="text-gray-600">Finding your location to recommend languages...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4 mx-auto">
            <Globe className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Select Language</CardTitle>
          {location && (
            <div className="flex items-center justify-center text-sm text-gray-600 mt-2">
              <MapPin className="w-4 h-4 mr-1" />
              {location}
            </div>
          )}
          <p className="text-gray-600 mt-2">
            Languages are prioritized based on your location
          </p>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {prioritizedLanguages.map((language, index) => (
            <Button
              key={language.code}
              variant={selectedLanguage === language.code ? "default" : "outline"}
              className="w-full justify-start text-left h-auto p-4"
              onClick={() => setSelectedLanguage(language.code)}
              disabled={loading}
            >
              <div className="flex items-center justify-between w-full">
                <div>
                  <div className="font-medium">{language.nativeName}</div>
                  <div className="text-sm text-gray-500">{language.name}</div>
                </div>
                {index < 3 && (
                  <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Recommended
                  </div>
                )}
              </div>
            </Button>
          ))}
          
          <Button 
            onClick={() => handleLanguageSelect(selectedLanguage)}
            className="w-full mt-6"
            disabled={loading || !selectedLanguage}
            size="lg"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <Loader className="w-4 h-4 animate-spin" />
                <span>Setting Language...</span>
              </div>
            ) : (
              'Continue'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
