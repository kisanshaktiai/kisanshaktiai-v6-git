
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { Button } from '@/components/ui/button';
import { setLanguage } from '@/store/slices/farmerSlice';
import { LanguageService } from '@/services/LanguageService';
import { Languages } from 'lucide-react';

interface LanguageScreenProps {
  onNext: () => void;
  onPrev: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export const LanguageScreen: React.FC<LanguageScreenProps> = ({ onNext, onPrev }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const languages = LanguageService.getInstance().getSupportedLanguages();

  const handleLanguageSelect = async (languageCode: string) => {
    try {
      await LanguageService.getInstance().changeLanguage(languageCode);
      dispatch(setLanguage(languageCode));
      onNext();
    } catch (error) {
      console.error('Language change error:', error);
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
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {languages.map((language) => (
            <Button
              key={language.code}
              variant="outline"
              onClick={() => handleLanguageSelect(language.code)}
              className="w-full py-3 text-left justify-start"
            >
              <div>
                <div className="font-medium">{language.nativeName}</div>
                <div className="text-sm text-gray-500">{language.name}</div>
              </div>
            </Button>
          ))}
        </div>

        <Button 
          variant="ghost" 
          onClick={onPrev}
          className="w-full"
        >
          Back
        </Button>
      </div>
    </div>
  );
};
