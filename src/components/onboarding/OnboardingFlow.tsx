import React, { useState, useEffect } from 'react';
import { WelcomeScreen } from './WelcomeScreen';
import { LocationBasedLanguageScreen } from './LocationBasedLanguageScreen';
import { AuthScreen } from './AuthScreen';
import { ProfileRegistrationScreen } from './ProfileRegistrationScreen';
import { OnboardingProgress } from './OnboardingProgress';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { useNavigate } from 'react-router-dom';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { farmer, userProfile, loading, isAuthenticated } = useCustomAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('OnboardingFlow: Auth state changed:', { 
      farmer: !!farmer, 
      userProfile: !!userProfile, 
      loading, 
      isAuthenticated 
    });
    
    // If user is fully authenticated, redirect to mobile app
    if (!loading && isAuthenticated && farmer) {
      console.log('OnboardingFlow: User is authenticated, redirecting to mobile app');
      navigate('/mobile');
    }
  }, [farmer, userProfile, loading, isAuthenticated, navigate]);

  const steps = [
    'Welcome',
    'Language', 
    'Authentication',
    'Profile'
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAuthComplete = () => {
    console.log('OnboardingFlow: Auth completed');
    // After successful authentication, check if profile is complete
    if (userProfile?.full_name) {
      console.log('OnboardingFlow: Profile complete, finishing onboarding');
      navigate('/mobile');
    } else {
      console.log('OnboardingFlow: Profile incomplete, moving to profile step');
      setCurrentStep(3); // Move to profile step
    }
  };

  const handleProfileComplete = () => {
    console.log('OnboardingFlow: Profile completed, finishing onboarding');
    navigate('/mobile');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated and has complete profile, redirect to mobile
  if (isAuthenticated && farmer && userProfile?.full_name) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  const renderCurrentStep = () => {
    switch (steps[currentStep]) {
      case 'Welcome':
        return (
          <WelcomeScreen 
            onNext={handleNext} 
            onPrev={handleBack}
            isFirstStep={currentStep === 0}
            isLastStep={currentStep === steps.length - 1}
          />
        );
      case 'Language':
        return (
          <LocationBasedLanguageScreen 
            onNext={handleNext}
          />
        );
      case 'Authentication':
        return (
          <AuthScreen 
            onComplete={handleAuthComplete}
          />
        );
      case 'Profile':
        return (
          <ProfileRegistrationScreen 
            onNext={handleNext}
            onPrev={handleBack}
            isFirstStep={currentStep === 0}
            isLastStep={currentStep === steps.length - 1}
            onComplete={handleProfileComplete}
          />
        );
      default:
        return (
          <WelcomeScreen 
            onNext={handleNext} 
            onPrev={handleBack}
            isFirstStep={currentStep === 0}
            isLastStep={currentStep === steps.length - 1}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <OnboardingProgress 
        currentStep={currentStep} 
        totalSteps={steps.length} 
        steps={steps}
      />
      {renderCurrentStep()}
    </div>
  );
};
