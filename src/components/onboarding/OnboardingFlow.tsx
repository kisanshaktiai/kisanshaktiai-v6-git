
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { RootState } from '@/store';
import { setOnboardingCompleted } from '@/store/slices/authSlice';
import { SkeletonSplashScreen } from '../splash/SkeletonSplashScreen';
import { EnhancedLanguageSelectionScreen } from './EnhancedLanguageSelectionScreen';
import { PhoneAuthScreen } from '../auth/PhoneAuthScreen';
import { useLanguage } from '../providers/LanguageProvider';

type OnboardingStep = 'splash' | 'language' | 'auth';

export const OnboardingFlow: React.FC = () => {
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user, profile } = useAuth();
  const { changeLanguage } = useLanguage();
  const { onboardingCompleted } = useSelector((state: RootState) => state.auth);
  
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('splash');
  const [isInitialized, setIsInitialized] = useState(false);

  // If user becomes authenticated during onboarding, complete the flow
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('User authenticated during onboarding, completing flow');
      handleAuthComplete();
    }
  }, [isAuthenticated, user]);

  const handleSplashComplete = () => {
    setIsInitialized(true);
    // Always show language selection for better user experience
    setCurrentStep('language');
  };

  const handleLanguageComplete = async (languageCode: string) => {
    try {
      // Change language using the enhanced language service
      await changeLanguage(languageCode);
      
      // Store selection timestamp
      localStorage.setItem('selectedLanguage', languageCode);
      localStorage.setItem('languageSelectedAt', new Date().toISOString());
      
      console.log(`Language selected: ${languageCode}`);
      setCurrentStep('auth');
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  const handleAuthComplete = () => {
    console.log('Completing onboarding flow');
    dispatch(setOnboardingCompleted());
  };

  // Show splash screen first
  if (currentStep === 'splash') {
    return <SkeletonSplashScreen onComplete={handleSplashComplete} />;
  }

  // Show loading if not initialized
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.initializing')}</p>
        </div>
      </div>
    );
  }

  // Enhanced language selection step
  if (currentStep === 'language') {
    return (
      <EnhancedLanguageSelectionScreen 
        onNext={handleLanguageComplete}
      />
    );
  }

  // Authentication step - only show if not authenticated
  if (currentStep === 'auth') {
    return <PhoneAuthScreen onComplete={handleAuthComplete} />;
  }

  // Fallback - should not reach here
  return null;
};
