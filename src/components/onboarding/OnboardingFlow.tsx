
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import EnhancedLanguageScreen from './EnhancedLanguageScreen';
import { MobileNumberScreen } from './MobileNumberScreen';
import PinSetupScreen from './PinSetupScreen';
import FarmerDetailsScreen from './FarmerDetailsScreen';
import { WelcomeScreen } from './WelcomeScreen';
import { customAuthService } from '@/services/customAuthService';

const OnboardingFlow: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [formData, setFormData] = useState({
    language: '',
    mobile: '',
    pin: '',
    farmerDetails: {} as any
  });

  const handleLanguageSelect = (language: string) => {
    setFormData(prev => ({ ...prev, language }));
    setCurrentStep(1);
  };

  const handleMobileSubmit = async (mobile: string) => {
    try {
      const exists = await customAuthService.checkExistingFarmer(mobile);
      if (exists) {
        toast.error('This mobile number is already registered. Please login instead.');
        return;
      }
      
      setFormData(prev => ({ ...prev, mobile }));
      setCurrentStep(2);
    } catch (error) {
      toast.error('Error checking mobile number. Please try again.');
    }
  };

  const handlePinSetup = (pin: string) => {
    setFormData(prev => ({ ...prev, pin }));
    setCurrentStep(3);
  };

  const handleFarmerDetails = (details: any) => {
    setFormData(prev => ({ ...prev, farmerDetails: details }));
    setCurrentStep(4);
  };

  const handleRegistration = async () => {
    try {
      const { success, error } = await customAuthService.register(
        formData.mobile,
        formData.pin,
        {
          ...formData.farmerDetails,
          preferred_language: formData.language
        }
      );

      if (success) {
        toast.success('Registration successful! Welcome to KisanShakti AI!');
        navigate('/dashboard');
      } else {
        toast.error(error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      toast.error('Registration failed. Please try again.');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const steps = [
    <EnhancedLanguageScreen onNext={handleLanguageSelect} />,
    <MobileNumberScreen 
      onNext={handleMobileSubmit} 
      onBack={handleBack}
      initialValue={formData.mobile}
    />,
    <PinSetupScreen 
      onNext={handlePinSetup} 
      onBack={handleBack}
    />,
    <FarmerDetailsScreen 
      onNext={handleFarmerDetails} 
      onBack={handleBack}
      language={formData.language}
    />,
    <WelcomeScreen 
      onComplete={handleRegistration}
      farmerName={formData.farmerDetails.full_name || 'Farmer'}
    />
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {steps[currentStep]}
    </div>
  );
};

export default OnboardingFlow;
