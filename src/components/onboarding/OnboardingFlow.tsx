
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { WelcomeScreen } from './WelcomeScreen';
import { LocationScreen } from './LocationScreen';
import { LanguageScreen } from './LanguageScreen';
import { AuthScreen } from './AuthScreen';
import { ProfileScreen } from './ProfileScreen';

export const OnboardingFlow: React.FC = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { component: WelcomeScreen, requiresAuth: false },
    { component: AuthScreen, requiresAuth: false },
    { component: LocationScreen, requiresAuth: true },
    { component: LanguageScreen, requiresAuth: true },
    { component: ProfileScreen, requiresAuth: true },
  ];

  const CurrentStepComponent = steps[currentStep]?.component || WelcomeScreen;

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

  // Skip to auth if not authenticated and current step requires auth
  React.useEffect(() => {
    const step = steps[currentStep];
    if (step?.requiresAuth && !isAuthenticated && currentStep !== 1) {
      setCurrentStep(1); // Go to auth screen
    } else if (isAuthenticated && currentStep < 2) {
      setCurrentStep(2); // Skip to location screen after auth
    }
  }, [isAuthenticated, currentStep]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <CurrentStepComponent 
        onNext={nextStep} 
        onPrev={prevStep}
        isFirstStep={currentStep === 0}
        isLastStep={currentStep === steps.length - 1}
      />
    </div>
  );
};
