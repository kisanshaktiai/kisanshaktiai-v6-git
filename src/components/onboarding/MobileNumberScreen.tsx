
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { setAuthenticated, setOnboardingCompleted } from '@/store/slices/authSlice';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { Phone, Smartphone, Loader, CheckCircle, AlertCircle } from 'lucide-react';

interface MobileNumberScreenProps {
  onNext: () => void;
  onPrev: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  onComplete?: () => void;
}

export const MobileNumberScreen: React.FC<MobileNumberScreenProps> = ({ 
  onNext, 
  onPrev,
  onComplete
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoDetecting, setAutoDetecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExistingUser, setIsExistingUser] = useState<boolean | null>(null);

  const { login, register, checkExistingFarmer } = useCustomAuth();

  useEffect(() => {
    autoDetectMobileNumber();
  }, []);

  const autoDetectMobileNumber = async () => {
    setAutoDetecting(true);
    try {
      // Simulate mobile number detection
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real app, this would use Capacitor plugins to detect SIM numbers
      const mockNumbers = ['9876543210', '8765432109'];
      const detectedNumber = mockNumbers[0]; // Use first number as default
      
      if (detectedNumber) {
        setMobileNumber(detectedNumber);
        // Check if user is already registered
        const isRegistered = await checkExistingFarmer(detectedNumber);
        setIsExistingUser(isRegistered);
      }
    } catch (error) {
      console.error('Auto-detection failed:', error);
    } finally {
      setAutoDetecting(false);
    }
  };

  const handleMobileNumberChange = async (value: string) => {
    const formatted = value.replace(/\D/g, '').slice(0, 10);
    setMobileNumber(formatted);
    setError(null);
    setIsExistingUser(null);

    // Check if user exists when number is complete
    if (formatted.length === 10) {
      const isRegistered = await checkExistingFarmer(formatted);
      setIsExistingUser(isRegistered);
    }
  };

  const handleContinue = async () => {
    if (!mobileNumber) {
      setError('Please enter your mobile number');
      return;
    }

    if (mobileNumber.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isExistingUser) {
        // For existing users, we'll need PIN authentication
        // This would typically redirect to PIN entry screen
        dispatch(setAuthenticated({
          userId: 'temp_user_id',
          phoneNumber: `+91${mobileNumber}`
        }));
        dispatch(setOnboardingCompleted());
        if (onComplete) {
          onComplete();
        }
      } else {
        // New user - continue to profile registration
        onNext();
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (autoDetecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4 mx-auto">
            <Smartphone className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Detecting Mobile Number
          </h1>
          <p className="text-gray-600">
            We're trying to automatically detect your mobile number...
          </p>
          <div className="flex items-center justify-center space-x-2">
            <Loader className="w-4 h-4 animate-spin text-blue-500" />
            <span className="text-sm text-gray-500">Please wait</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 mx-auto">
            <Phone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('auth.mobile_number')}
          </h1>
          <p className="text-gray-600">
            Enter your mobile number to continue
          </p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Input
              type="tel"
              placeholder="+91 9876543210"
              value={mobileNumber}
              onChange={(e) => handleMobileNumberChange(e.target.value)}
              className="text-center text-lg py-3 pr-10"
              maxLength={10}
            />
            {isExistingUser !== null && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {isExistingUser ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                )}
              </div>
            )}
          </div>

          {isExistingUser !== null && (
            <div className={`text-sm text-center p-2 rounded-lg ${
              isExistingUser 
                ? 'bg-green-50 text-green-800' 
                : 'bg-orange-50 text-orange-800'
            }`}>
              {isExistingUser 
                ? 'Welcome back! We found your account.' 
                : 'New user - we\'ll create your account.'}
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 text-center p-2 bg-red-50 rounded-lg">
              {error}
            </div>
          )}
          
          <Button 
            onClick={handleContinue}
            disabled={!mobileNumber || loading}
            className="w-full py-3 text-lg"
            size="lg"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <Loader className="w-4 h-4 animate-spin" />
                <span>{isExistingUser ? 'Logging in...' : 'Creating account...'}</span>
              </div>
            ) : (
              isExistingUser ? 'Login' : 'Continue'
            )}
          </Button>
        </div>

        <div className="text-center">
          <Button 
            variant="ghost" 
            onClick={onPrev}
            className="w-full"
            disabled={loading}
          >
            Back
          </Button>
        </div>

        <div className="text-xs text-gray-500 text-center">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </div>
      </div>
    </div>
  );
};
