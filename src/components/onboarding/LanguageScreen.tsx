
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { Button } from '@/components/ui/button';
import { setLanguage } from '@/store/slices/farmerSlice';
import { LanguageService } from '@/services/LanguageService';
import { Languages, Check } from 'lucide-react';

interface LanguageScreenProps {
  onNext: () => void;
  onPrev: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  onComplete?: () => void;
}

export const LanguageScreen: React.FC<LanguageScreenProps> = ({ onNext, onPrev }) => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [autoDetected, setAutoDetected] = useState<string | null>(null);
  const languages = LanguageService.getInstance().getSupportedLanguages();

  // Auto-detect device language on component mount
  useEffect(() => {
    const detectLanguage = () => {
      const browserLang = navigator.language || navigator.languages?.[0] || 'en';
      const langCode = browserLang.split('-')[0]; // Get language code without region
      
      // Check if detected language is supported
      const supportedLang = languages.find(lang => lang.code === langCode);
      
      if (supportedLang) {
        setAutoDetected(langCode);
        setSelectedLanguage(langCode);
        console.log('Auto-detected language:', supportedLang.name);
        
        // Automatically apply the detected language
        LanguageService.getInstance().changeLanguage(langCode);
        dispatch(setLanguage(langCode));
      } else {
        // Default to Hindi if detection fails
        setSelectedLanguage('hi');
        setAutoDetected('hi');
      }
    };

    detectLanguage();
  }, [languages, dispatch]);

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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mb-4 mx-auto">
            <Languages className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('onboarding.language_title')}
          </h1>
          <p className="text-gray-600">
            {t('onboarding.language_subtitle')}
          </p>
          {autoDetected && (
            <p className="text-sm text-blue-600 mt-2">
              {t('onboarding.autoDetected')}: {languages.find(l => l.code === autoDetected)?.nativeName}
            </p>
          )}
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {languages.map((language) => (
            <Button
              key={language.code}
              variant={selectedLanguage === language.code ? "default" : "outline"}
              onClick={() => handleLanguageSelect(language.code)}
              className="w-full py-3 text-left justify-between"
            >
              <div>
                <div className="font-medium">{language.nativeName}</div>
                <div className="text-sm text-gray-500">{language.name}</div>
              </div>
              {selectedLanguage === language.code && (
                <Check className="w-5 h-5" />
              )}
            </Button>
          ))}
        </div>

        <div className="space-y-3">
          <Button 
            onClick={handleContinue}
            disabled={!selectedLanguage}
            className="w-full py-3 text-lg"
            size="lg"
          >
            {t('common.continue')}
          </Button>

          <Button 
            variant="ghost" 
            onClick={onPrev}
            className="w-full"
          >
            {t('common.back')}
          </Button>
        </div>
      </div>
    </div>
  );
};
