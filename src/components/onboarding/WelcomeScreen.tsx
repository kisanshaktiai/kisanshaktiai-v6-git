
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Sprout, Smartphone, Users } from 'lucide-react';

interface WelcomeScreenProps {
  onNext: () => void;
  onPrev: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  onComplete?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNext }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <div className="mb-8">
        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-4 mx-auto">
          <Sprout className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('onboarding.welcome_title')}
        </h1>
        <p className="text-lg text-gray-600">
          {t('onboarding.welcome_subtitle')}
        </p>
      </div>

      <div className="space-y-6 mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Smartphone className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">AI-Powered Advice</h3>
            <p className="text-gray-600">Get personalized farming recommendations</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <Users className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Community Support</h3>
            <p className="text-gray-600">Connect with fellow farmers</p>
          </div>
        </div>
      </div>

      <Button 
        onClick={onNext} 
        className="w-full py-3 text-lg"
        size="lg"
      >
        {t('common.continue')}
      </Button>
    </div>
  );
};
