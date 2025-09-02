
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { RootState } from '@/store';
import { setOnboardingCompleted } from '@/store/slices/authSlice';
import { SkeletonSplashScreen } from '../splash/SkeletonSplashScreen';
import { EnhancedLanguageSelectionScreen } from './EnhancedLanguageSelectionScreen';
import { PhoneAuthScreen } from '../auth/PhoneAuthScreen';
import { languageSyncService } from '@/services/LanguageSyncService';

type OnboardingStep = 'splash' | 'language' | 'auth';

export const OnboardingFlow: React.FC = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const { onboardingCompleted } = useSelector((state: RootState) => state.auth);
  
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('splash');
  const [isInitialized, setIsInitialized] = useState(false);
  const [needsLanguageSelection, setNeedsLanguageSelection] = useState(false);

  // Check if language selection is needed
  useEffect(() => {
    const checkLanguageSelection = async () => {
      try {
        const needs = await languageSyncService.needsLanguageSelection();
        setNeedsLanguageSelection(needs);
        console.log('Language selection needed:', needs);
      } catch (error) {
        console.error('Failed to check language selection needs:', error);
        setNeedsLanguageSelection(true); // Default to showing selection
      }
    };

    checkLanguageSelection();
  }, []);

  // If user becomes authenticated during onboarding, complete the flow
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('User authenticated during onboarding, completing flow');
      handleAuthComplete();
    }
  }, [isAuthenticated, user]);

  const handleSplashComplete = () => {
    setIsInitialized(true);
    
    // Show language selection only if needed
    if (needsLanguageSelection) {
      setCurrentStep('language');
    } else {
      // Skip to auth if language is already set
      setCurrentStep('auth');
    }
  };

  const handleLanguageComplete = async (languageCode: string) => {
    try {
      // Store language selection using sync service
      await languageSyncService.storeLanguageSelection(languageCode);
      
      console.log(`Language selected and stored: ${languageCode}`);
      setCurrentStep('auth');
    } catch (error) {
      console.error('Failed to store language selection:', error);
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

  // Enhanced language selection step - only if needed
  if (currentStep === 'language' && needsLanguageSelection) {
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
