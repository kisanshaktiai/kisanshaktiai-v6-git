
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { RootState } from '@/store';
import { setOnboardingCompleted } from '@/store/slices/authSlice';
import { SkeletonSplashScreen } from '../splash/SkeletonSplashScreen';
import { LocationBasedLanguageScreen } from './LocationBasedLanguageScreen';
import { CustomMobileAuthScreen } from '../auth/CustomMobileAuthScreen';

type OnboardingStep = 'splash' | 'language' | 'auth';

export const OnboardingFlow: React.FC = () => {
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
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
    return <CustomMobileAuthScreen onComplete={handleAuthComplete} />;
  }

  // Fallback - should not reach here
  return null;
};
