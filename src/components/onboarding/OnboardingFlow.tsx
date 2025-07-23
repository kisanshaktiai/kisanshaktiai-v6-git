
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
  const [selectedLanguage, setSelectedLanguage] = useState<string>('hi');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { farmer, userProfile, loading } = useCustomAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('OnboardingFlow: Auth state changed:', { farmer: !!farmer, userProfile: !!userProfile, loading });
    
    if (!loading && farmer) {
      console.log('OnboardingFlow: User is authenticated, redirecting to dashboard');
      setIsAuthenticated(true);
      // Navigate to mobile app instead of calling onComplete
      navigate('/mobile');
    }
  }, [farmer, userProfile, loading, navigate]);

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

  const handleLanguageSelect = (language: string) => {
    console.log('OnboardingFlow: Language selected:', language);
    setSelectedLanguage(language);
    handleNext();
  };

  const handleAuthComplete = () => {
    console.log('OnboardingFlow: Auth completed');
    // Check if profile is complete
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

  if (isAuthenticated) {
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
            onPrev={handleBack}
          />
        );
      case 'Authentication':
        return (
          <AuthScreen 
            onComplete={handleAuthComplete}
            selectedLanguage={selectedLanguage}
          />
        );
      case 'Profile':
        return (
          <ProfileRegistrationScreen 
            onComplete={handleProfileComplete}
            selectedLanguage={selectedLanguage}
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
