import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LocationService } from '@/services/LocationService';
import { LanguageService } from '@/services/LanguageService';
import { MapPin, Loader } from 'lucide-react';

interface LocationBasedLanguageScreenProps {
  onNext: () => void;
}

// State to language mapping - updated with new languages
const stateLanguageMapping: Record<string, string[]> = {
  'maharashtra': ['mr', 'hi', 'en'],
  'gujarat': ['gu', 'hi', 'en'],
  'punjab': ['pa', 'hi', 'en'],
  'haryana': ['hi', 'pa', 'en'],
  'tamil nadu': ['ta', 'en', 'hi'],
  'telangana': ['te', 'hi', 'en'],
  'andhra pradesh': ['te', 'hi', 'en'],
  'karnataka': ['kn', 'hi', 'en'],
  'kerala': ['ml', 'en', 'hi'],
  'odisha': ['or', 'hi', 'en'],
  'west bengal': ['bn', 'hi', 'en'],
  'uttar pradesh': ['hi', 'en'],
  'bihar': ['hi', 'en'],
  'rajasthan': ['hi', 'en'],
  'madhya pradesh': ['hi', 'en'],
  'chhattisgarh': ['hi', 'en'],
  'jharkhand': ['hi', 'bn', 'en'],
  'uttarakhand': ['hi', 'en'],
  'jammu and kashmir': ['ur', 'hi', 'en'],
  'ladakh': ['ur', 'hi', 'en'],
  'manipur': ['en', 'hi'],
  'nagaland': ['en', 'hi'],
  'mizoram': ['en', 'hi'],
  'tripura': ['bn', 'en', 'hi'],
  'assam': ['bn', 'hi', 'en'],
  'meghalaya': ['en', 'hi'],
  'sikkim': ['en', 'hi'], 
  'goa': ['en', 'mr', 'kn'],
  'delhi': ['hi', 'en', 'pa', 'ur'],
  'default': ['hi', 'en', 'mr', 'pa', 'gu', 'te', 'ta', 'kn', 'bn', 'ml', 'or', 'ur']
};

export const LocationBasedLanguageScreen: React.FC<LocationBasedLanguageScreenProps> = ({ onNext }) => {
  const { t, i18n } = useTranslation();
  const { tenantBranding } = useSelector((state: RootState) => state.tenant);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<string | null>(null);
  const [prioritizedLanguages, setPrioritizedLanguages] = useState<any[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('hi');

  const allLanguages = [
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
    { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
    { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
    { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
    { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
    { code: 'ur', name: 'Urdu', nativeName: 'اُردُو' },
  ];

  // Get tenant colors with fallbacks
  const primaryColor = tenantBranding?.primary_color || '#8BC34A';
  const secondaryColor = tenantBranding?.secondary_color || '#4CAF50';
  const appName = tenantBranding?.app_name || 'KisanShakti AI';
  const logoUrl = tenantBranding?.logo_url || '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png';

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-green-100">
        <Card className="w-full max-w-md mx-6 shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto"
                 style={{ backgroundColor: primaryColor }}>
              <Loader className="w-8 h-8 text-white animate-spin" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-gray-800">Detecting Location</h2>
            <p className="text-gray-600">Finding your location to recommend languages...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 flex flex-col">
      {/* Compact Header with Logo */}
      <div className="pt-4 pb-2 text-center">
        <div className="w-8 h-8 mx-auto mb-1 rounded-lg shadow-md bg-white flex items-center justify-center overflow-hidden">
          <img 
            src={logoUrl} 
            alt={appName}
            className="w-6 h-6 object-contain"
          />
        </div>
        <h1 className="text-lg font-bold text-gray-800">{appName}</h1>
      </div>

      {/* Compact Location Info */}
      {location && (
        <div className="px-4 mb-2">
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-600 bg-white/70 backdrop-blur-sm rounded-full px-3 py-1.5 mx-auto w-fit shadow-sm">
            <MapPin className="w-3 h-3" style={{ color: primaryColor }} />
            <span>{location}</span>
          </div>
        </div>
      )}

      {/* Language Selection */}
      <div className="flex-1">
        <Card className="mx-0 rounded-none shadow-none border-0 bg-transparent">
          <CardContent className="p-0">
            <div className="space-y-1 px-2">
              {prioritizedLanguages.map((language, index) => (
                <Button
                  key={language.code}
                  variant={selectedLanguage === language.code ? "default" : "outline"}
                  className={`w-full justify-between text-left h-auto p-4 transition-all duration-200 ${
                    selectedLanguage === language.code 
                      ? 'shadow-lg scale-[1.02] border-2' 
                      : 'hover:shadow-md hover:scale-[1.01] border-2 border-gray-200 bg-white'
                  }`}
                  style={{
                    backgroundColor: selectedLanguage === language.code ? primaryColor : 'white',
                    borderColor: selectedLanguage === language.code ? primaryColor : '#e5e7eb',
                    color: selectedLanguage === language.code ? 'white' : '#374151'
                  }}
                  onClick={() => setSelectedLanguage(language.code)}
                  disabled={loading}
                >
                  <div className="flex-1">
                    <div className="font-semibold text-base">{language.nativeName}</div>
                    <div className={`text-sm ${selectedLanguage === language.code ? 'text-white/80' : 'text-gray-500'}`}>
                      {language.name}
                    </div>
                  </div>
                  {index < 3 && (
                    <div 
                      className="text-xs px-2 py-1 rounded-full font-medium"
                      style={{
                        backgroundColor: selectedLanguage === language.code ? 'rgba(255,255,255,0.2)' : secondaryColor,
                        color: 'white'
                      }}
                    >
                      Recommended
                    </div>
                  )}
                </Button>
              ))}
            </div>
            
            <div className="p-4">
              <Button 
                onClick={() => handleLanguageSelect(selectedLanguage)}
                className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                style={{ backgroundColor: primaryColor }}
                disabled={loading || !selectedLanguage}
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center space-x-3">
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Setting Language...</span>
                  </div>
                ) : (
                  'Continue'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Gradient */}
      <div className="h-4 bg-gradient-to-t from-green-100 to-transparent"></div>
    </div>
  );
};
