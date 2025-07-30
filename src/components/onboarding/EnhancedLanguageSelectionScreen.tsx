
import React from 'react';
import { useTranslation } from 'react-i18next';
import { UnifiedLanguageSelector } from '../language/UnifiedLanguageSelector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, ArrowRight } from 'lucide-react';

interface EnhancedLanguageSelectionScreenProps {
  onNext: (languageCode: string) => Promise<void>;
}

export const EnhancedLanguageSelectionScreen: React.FC<EnhancedLanguageSelectionScreenProps> = ({ 
  onNext 
}) => {
  const { t } = useTranslation();

  const handleLanguageSelect = async (languageCode: string) => {
    await onNext(languageCode);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 p-4 flex flex-col justify-center">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
          <Globe className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t('onboarding.selectLanguage', 'Select Your Language')}
        </h1>
        <p className="text-gray-600 max-w-md mx-auto">
          {t('onboarding.languageDescription', 'Choose your preferred language for the best experience. We recommend languages based on your location.')}
        </p>
      </div>

      {/* Language Selector */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-2xl">
          <UnifiedLanguageSelector 
            onLanguageSelect={handleLanguageSelect}
            showLocationInfo={true}
            showRecentLanguages={false} // Skip recent for onboarding
            showSearch={true}
            variant="full"
            className="shadow-xl border-0 bg-white/80 backdrop-blur-sm"
          />
        </div>
      </div>

      {/* Footer hint */}
      <div className="text-center mt-8">
        <p className="text-sm text-gray-500 flex items-center justify-center">
          <span>{t('onboarding.languageHint', 'You can change this later in settings')}</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </p>
      </div>
    </div>
  );
};
