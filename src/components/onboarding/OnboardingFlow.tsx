
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { RootState } from '@/store';
import { setOnboardingCompleted } from '@/store/slices/authSlice';
import { EnhancedSplashScreen } from '../splash/EnhancedSplashScreen';
import { EnhancedLanguageScreen } from './EnhancedLanguageScreen';
import { PhoneAuthScreen } from '../auth/PhoneAuthScreen';

type OnboardingStep = 'splash' | 'language' | 'auth';

export const OnboardingFlow: React.FC = () => {
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const { isAuthenticated, loading } = useCustomAuth();
  const { onboardingCompleted } = useSelector((state: RootState) => state.auth);
  
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('splash');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize app and check for existing language preference
  useEffect(() => {
    const initializeApp = async () => {
      // Check if language was already selected on this device
      const savedLanguage = localStorage.getItem('selectedLanguage');
      const languageSelectedAt = localStorage.getItem('languageSelectedAt');
      
      if (savedLanguage && languageSelectedAt) {
        // Apply saved language
        try {
          await i18n.changeLanguage(savedLanguage);
          console.log('Applied saved language:', savedLanguage);
        } catch (error) {
          console.error('Error applying saved language:', error);
        }
      }
    };

    initializeApp();
  }, [i18n]);

  const handleSplashComplete = () => {
    setIsInitialized(true);
    
    // For returning users (authenticated), skip language and go to auth completion
    if (isAuthenticated) {
      console.log('Returning user detected, completing onboarding');
      dispatch(setOnboardingCompleted());
      return;
    }
    
    // For first-time users, check language selection
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
    dispatch(setOnboardingCompleted());
  };

  // Show loading if auth is still being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.initializing')}</p>
        </div>
      </div>
    );
  }

  // Show splash screen first (always, for branding and tenant loading)
  if (currentStep === 'splash') {
    return <EnhancedSplashScreen onComplete={handleSplashComplete} />;
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

  // Language selection step (only for first-time users or expired language selection)
  if (currentStep === 'language') {
    return (
      <EnhancedLanguageScreen 
        onNext={handleLanguageComplete}
      />
    );
  }

  // Authentication step - only show if not authenticated
  if (currentStep === 'auth' && !isAuthenticated) {
    return <PhoneAuthScreen onComplete={handleAuthComplete} />;
  }

  // Fallback - should not reach here
  return null;
};
