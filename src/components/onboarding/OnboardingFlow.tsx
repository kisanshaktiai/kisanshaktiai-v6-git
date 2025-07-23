
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { WelcomeScreen } from './WelcomeScreen';
import { MobileNumberScreen } from './MobileNumberScreen';
import { PinAuthScreen } from '../auth/PinAuthScreen';
import { ProfileRegistrationScreen } from './ProfileRegistrationScreen';
import { setProfile } from '@/store/slices/farmerSlice';
import { setOnboardingCompleted } from '@/store/slices/authSlice';

export const OnboardingFlow: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [currentStep, setCurrentStep] = useState(0);
  const [mobileNumber, setMobileNumber] = useState('');
  const [pin, setPin] = useState('');
  const [userExists, setUserExists] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  const steps = [
    'welcome',
    'mobile',
    'pin',
    'profile'
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleMobileNumberNext = (mobile: string, exists: boolean, data?: any) => {
    setMobileNumber(mobile);
    setUserExists(exists);
    setUserData(data);
    setCurrentStep(2); // Go to PIN screen
  };

  const handlePinNext = (data: any) => {
    setPin(data.pin);
    if (userExists) {
      navigate('/dashboard');
    } else {
      setCurrentStep(3);
    }
  };

  const handleRegistrationComplete = (data: any) => {
    if (data.profile) {
      dispatch(setProfile(data.profile));
    }
    
    dispatch(setOnboardingCompleted());
    navigate('/dashboard');
  };

  const renderStep = () => {
    switch (steps[currentStep]) {
      case 'welcome':
        return (
          <WelcomeScreen 
            onNext={handleNext} 
            onPrev={handlePrev}
            isFirstStep={currentStep === 0}
            isLastStep={currentStep === steps.length - 1}
          />
        );
      case 'mobile':
        return <MobileNumberScreen onNext={handleMobileNumberNext} onPrev={handlePrev} />;
      case 'pin':
        return (
          <PinAuthScreen 
            mobileNumber={mobileNumber}
            userExists={userExists}
            userData={userData}
            onNext={handlePinNext}
            onPrev={handlePrev}
          />
        );
      case 'profile':
        return (
          <ProfileRegistrationScreen 
            mobileNumber={mobileNumber}
            pin={pin}
            onNext={handleRegistrationComplete}
            onPrev={handlePrev}
          />
        );
      default:
        return (
          <WelcomeScreen 
            onNext={handleNext} 
            onPrev={handlePrev}
            isFirstStep={currentStep === 0}
            isLastStep={currentStep === steps.length - 1}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      {renderStep()}
    </div>
  );
};
