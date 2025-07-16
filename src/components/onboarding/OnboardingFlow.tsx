
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { RootState } from '@/store';
import { setOnboardingCompleted } from '@/store/slices/authSlice';
import { SkeletonSplashScreen } from '../splash/SkeletonSplashScreen';
import { EnhancedLanguageScreen } from './EnhancedLanguageScreen';
import { PinAuthScreen } from '../auth/PinAuthScreen';

type OnboardingStep = 'splash' | 'language' | 'auth';

export const OnboardingFlow: React.FC = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { isAuthenticated: contextIsAuthenticated } = useAuth();
  const { isAuthenticated: reduxIsAuthenticated, onboardingCompleted } = useSelector((state: RootState) => state.auth);
  
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('splash');
  const [isInitialized, setIsInitialized] = useState(false);

  // Use the most reliable source of authentication state
  const isAuthenticated = contextIsAuthenticated || reduxIsAuthenticated;

  // If user is already authenticated and onboarded, this component should not be rendered
  useEffect(() => {
    if (isAuthenticated && onboardingCompleted) {
      console.log('User is already authenticated and onboarded, OnboardingFlow should not be shown');
    }
  }, [isAuthenticated, onboardingCompleted]);

  const handleSplashComplete = () => {
    setIsInitialized(true);
    
    // Check if we need language selection (first time users)
    const hasSelectedLanguage = localStorage.getItem('i18nextLng');
    if (!hasSelectedLanguage || hasSelectedLanguage === 'undefined') {
      setCurrentStep('language');
    } else {
      setCurrentStep('auth');
    }
  };

  const handleLanguageComplete = () => {
    setCurrentStep('auth');
  };

  const handleAuthComplete = () => {
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

  // Language selection step
  if (currentStep === 'language') {
    return (
      <EnhancedLanguageScreen 
        onNext={handleLanguageComplete}
        onSkip={handleLanguageComplete}
      />
    );
  }

  // Authentication step - only show if not authenticated
  if (currentStep === 'auth') {
    return <PinAuthScreen onComplete={handleAuthComplete} />;
  }

  // Fallback - should not reach here
  return null;
};
