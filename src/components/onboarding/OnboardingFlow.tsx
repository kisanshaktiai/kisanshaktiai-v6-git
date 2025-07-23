
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { useNetworkState } from '@/hooks/useNetworkState';
import { RootState } from '@/store';
import { setOnboardingCompleted } from '@/store/slices/authSlice';
import { EnhancedSplashScreen } from '../splash/EnhancedSplashScreen';
import { EnhancedLanguageScreen } from './EnhancedLanguageScreen';
import { EnhancedPhoneAuthScreen } from '../auth/EnhancedPhoneAuthScreen';
import { localStorageService } from '@/services/storage/localStorageService';
import { offlineSyncManager } from '@/services/sync/offlineSyncManager';
import { useBranding } from '@/contexts/BrandingContext';
import { Loader } from 'lucide-react';
import { OfflineBanner } from '../ui/OfflineBanner';

type OnboardingStep = 'splash' | 'language' | 'auth';

export const OnboardingFlow: React.FC = () => {
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const { isAuthenticated, loading } = useCustomAuth();
  const { isOnline } = useNetworkState();
  const { onboardingCompleted } = useSelector((state: RootState) => state.auth);
  const { branding, loading: loadingBranding, error } = useBranding();
  
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('splash');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize app and sync manager
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Start offline sync manager
        offlineSyncManager.startBackgroundSync();
        
        // Check if language was already selected
        const savedLanguage = localStorageService.getCacheIfValid('user_language_preference');
        if (savedLanguage) {
          try {
            await i18n.changeLanguage(savedLanguage);
            console.log('Applied cached language preference:', savedLanguage);
          } catch (error) {
            console.error('Error applying cached language:', error);
          }
        }

        // Check for offline registration data
        const offlineRegistration = localStorageService.getSecure('offline_registration');
        if (offlineRegistration && isOnline) {
          console.log('Found offline registration data, attempting to sync...');
          // This will be handled by the sync manager
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('App initialization error:', error);
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, [i18n, isOnline]);

  const handleSplashComplete = () => {
    console.log('Splash completed, checking authentication status...');
    
    // For returning users (authenticated), complete onboarding
    if (isAuthenticated) {
      console.log('Returning user detected, completing onboarding');
      dispatch(setOnboardingCompleted());
      return;
    }
    
    // For new users, check language selection
    const savedLanguage = localStorageService.getCacheIfValid('user_language_preference');
    
    if (!savedLanguage) {
      console.log('No language preference found, showing language selection');
      setCurrentStep('language');
    } else {
      console.log('Language preference found, proceeding to auth');
      setCurrentStep('auth');
    }
  };

  const handleLanguageComplete = () => {
    console.log('Language selection completed, proceeding to auth');
    setCurrentStep('auth');
  };

  const handleAuthComplete = () => {
    console.log('Authentication completed, finishing onboarding');
    dispatch(setOnboardingCompleted());
  };

  // Show loading if auth is still being determined or branding is loading
  if (loading || loadingBranding) {
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
    return (
      <>
        <OfflineBanner />
        <EnhancedSplashScreen onComplete={handleSplashComplete} />
      </>
    );
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
      <>
        <OfflineBanner />
        <EnhancedLanguageScreen onNext={handleLanguageComplete} />
      </>
    );
  }

  // Authentication step - only show if not authenticated
  if (currentStep === 'auth' && !isAuthenticated) {
    return (
      <>
        <OfflineBanner />
        <EnhancedPhoneAuthScreen onComplete={handleAuthComplete} />
      </>
    );
  }

  // Fallback - should not reach here
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
      <div className="text-center">
        <Loader className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
        <p className="text-gray-600">{t('common.redirecting')}</p>
      </div>
    </div>
  );
};
