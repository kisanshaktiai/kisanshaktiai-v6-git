
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { SplashScreen } from '../splash/SplashScreen';
import { WelcomeScreen } from './WelcomeScreen';
import { LocationScreen } from './LocationScreen';
import { LanguageScreen } from './LanguageScreen';
import { MobileNumberScreen } from './MobileNumberScreen';
import { ProfileRegistrationScreen } from './ProfileRegistrationScreen';
import { OnboardingProgress } from './OnboardingProgress';

export const OnboardingFlow: React.FC = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, onboardingCompleted } = useSelector((state: RootState) => state.auth);
  const [currentStep, setCurrentStep] = useState(0);
  const [showSplash, setShowSplash] = useState(true);

  const steps = [
    { component: WelcomeScreen, name: 'Welcome', requiresAuth: false },
    { component: LocationScreen, name: 'Location', requiresAuth: false },
    { component: LanguageScreen, name: 'Language', requiresAuth: false },
    { component: MobileNumberScreen, name: 'Mobile', requiresAuth: false },
    { component: ProfileRegistrationScreen, name: 'Profile', requiresAuth: true },
  ];

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle authentication state changes
  useEffect(() => {
    if (isAuthenticated && onboardingCompleted) {
      // User is fully onboarded, redirect to main app
      window.location.href = '/';
      return;
    }

    const step = steps[currentStep];
    if (step?.requiresAuth && !isAuthenticated && currentStep !== 3) {
      // If step requires auth but user isn't authenticated, go to mobile number screen
      setCurrentStep(3);
    } else if (isAuthenticated && currentStep === 3) {
      // User just authenticated, check if they need profile setup
      // This would typically check if user exists in database
      // For now, always go to profile setup for new users
      setCurrentStep(4);
    }
  }, [isAuthenticated, onboardingCompleted, currentStep]);

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  const CurrentStepComponent = steps[currentStep]?.component || WelcomeScreen;
  const showProgress = currentStep > 0; // Don't show progress on welcome screen

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {showProgress && (
        <div className="fixed top-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-sm p-4">
          <OnboardingProgress
            currentStep={currentStep}
            totalSteps={steps.length}
            steps={steps.map(s => s.name)}
          />
        </div>
      )}
      
      <div className={showProgress ? 'pt-24' : ''}>
        <CurrentStepComponent 
          onNext={nextStep} 
          onPrev={prevStep}
          isFirstStep={currentStep === 0}
          isLastStep={currentStep === steps.length - 1}
        />
      </div>
    </div>
  );
};
