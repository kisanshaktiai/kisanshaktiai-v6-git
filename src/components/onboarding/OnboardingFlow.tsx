
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
      // Navigate to dashboard instead of calling onComplete
      navigate('/dashboard');
    }
  }, [farmer, userProfile, loading, navigate]);

  const steps = [
    'welcome',
    'language',
    'auth',
    'profile'
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
      navigate('/dashboard');
    } else {
      console.log('OnboardingFlow: Profile incomplete, moving to profile step');
      setCurrentStep(3); // Move to profile step
    }
  };

  const handleProfileComplete = () => {
    console.log('OnboardingFlow: Profile completed, finishing onboarding');
    navigate('/dashboard');
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
      case 'welcome':
        return <WelcomeScreen onNext={handleNext} />;
      case 'language':
        return (
          <LocationBasedLanguageScreen 
            onLanguageSelect={handleLanguageSelect}
            onBack={handleBack}
          />
        );
      case 'auth':
        return (
          <AuthScreen 
            onComplete={handleAuthComplete}
            onBack={handleBack}
            selectedLanguage={selectedLanguage}
          />
        );
      case 'profile':
        return (
          <ProfileRegistrationScreen 
            onComplete={handleProfileComplete}
            onBack={handleBack}
            selectedLanguage={selectedLanguage}
          />
        );
      default:
        return <WelcomeScreen onNext={handleNext} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <OnboardingProgress currentStep={currentStep} totalSteps={steps.length} />
      {renderCurrentStep()}
    </div>
  );
};
