
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { RootState } from '@/store';
import { setOnboardingCompleted } from '@/store/slices/authSlice';
import { SkeletonSplashScreen } from '../splash/SkeletonSplashScreen';
import { LocationBasedLanguageScreen } from './LocationBasedLanguageScreen';
import { PhoneAuthScreen } from '../auth/PhoneAuthScreen';

type OnboardingStep = 'splash' | 'language' | 'auth';

export const OnboardingFlow: React.FC = () => {
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user, profile } = useAuth();
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
    
    // Check if language was already selected on this device
    const savedLanguage = localStorage.getItem('selectedLanguage');
    const languageSelectedAt = localStorage.getItem('languageSelectedAt');
    
    // Show language selection if not previously selected or if it was selected more than 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    if (!savedLanguage || !languageSelectedAt || new Date(languageSelectedAt) < thirtyDaysAgo) {
      setCurrentStep('language');
    } else {
      // Language recently selected, proceed to auth
      setCurrentStep('auth');
    }
  };

  const handleLanguageComplete = () => {
    setCurrentStep('auth');
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

  // Location-based language selection step
  if (currentStep === 'language') {
    return (
      <LocationBasedLanguageScreen 
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
