
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { AuthHeader } from './AuthHeader';
import { toast } from 'sonner';

interface LocationState {
  mobileNumber?: string;
  isRegistration?: boolean;
  farmerData?: any;
}

export const PinAuthScreen: React.FC = () => {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useCustomAuth();

  const state = location.state as LocationState;
  const mobileNumber = state?.mobileNumber;
  const isRegistration = state?.isRegistration;
  const farmerData = state?.farmerData;

  useEffect(() => {
    if (!mobileNumber) {
      console.error('PinAuthScreen: No mobile number provided');
      navigate('/onboarding', { replace: true });
    }
  }, [mobileNumber, navigate]);

  const handlePinComplete = async (enteredPin: string) => {
    if (enteredPin.length !== 4) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('PinAuthScreen: Processing PIN for mobile:', mobileNumber);
      
      if (isRegistration) {
        console.log('PinAuthScreen: Attempting registration');
        const result = await register(mobileNumber!, enteredPin, farmerData || {});
        
        if (result.success) {
          console.log('PinAuthScreen: Registration successful');
          toast.success('Registration successful! Welcome to KisanShakti AI');
          navigate('/dashboard', { replace: true });
        } else {
          console.error('PinAuthScreen: Registration failed:', result.error);
          setError(result.error || 'Registration failed');
          setPin('');
        }
      } else {
        console.log('PinAuthScreen: Attempting login');
        const result = await login(mobileNumber!, enteredPin);
        
        if (result.success) {
          console.log('PinAuthScreen: Login successful');
          toast.success('Login successful! Welcome back');
          navigate('/dashboard', { replace: true });
        } else {
          console.error('PinAuthScreen: Login failed:', result.error);
          setError(result.error || 'Login failed');
          setPin('');
        }
      }
    } catch (error) {
      console.error('PinAuthScreen: Authentication error:', error);
      setError('Authentication failed. Please try again.');
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinChange = (value: string) => {
    setPin(value);
    setError(null);
    
    if (value.length === 4) {
      handlePinComplete(value);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (!mobileNumber) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <AuthHeader 
          userCheckComplete={true}
          isNewUser={isRegistration || false}
          currentStep={isRegistration ? 'signup' : 'login'}
        />

        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🔐</span>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isRegistration ? "Set Your PIN" : "Welcome Back"}
              </h2>
              <p className="text-gray-600 mt-1">
                {isRegistration 
                  ? "Choose a secure 4-digit PIN" 
                  : "Enter your 4-digit PIN to continue"
                }
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Mobile: {mobileNumber}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-center">
              <InputOTP
                maxLength={4}
                value={pin}
                onChange={handlePinChange}
                disabled={isLoading}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm text-center">{error}</p>
              </div>
            )}

            {isLoading && (
              <div className="text-center">
                <p className="text-gray-600 text-sm">
                  {isRegistration ? "Creating your account..." : "Verifying PIN..."}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleGoBack}
              variant="outline"
              className="w-full"
              disabled={isLoading}
            >
              Back
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              {isRegistration 
                ? "Your PIN will be used to securely access your account"
                : "Forgot your PIN? Contact support for assistance"
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
