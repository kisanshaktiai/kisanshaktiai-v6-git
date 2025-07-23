
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { ArrowLeft, Smartphone, Shield, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { MobileNumberService } from '@/services/MobileNumberService';
import { toast } from 'sonner';

interface EnhancedPhoneAuthScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

type AuthStep = 'phone' | 'pin_new' | 'pin_existing';

export const EnhancedPhoneAuthScreen: React.FC<EnhancedPhoneAuthScreenProps> = ({
  onBack,
  onSuccess
}) => {
  const [currentStep, setCurrentStep] = useState<AuthStep>('phone');
  const [mobileNumber, setMobileNumber] = useState('');
  const [pin, setPin] = useState('');
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(false);
  
  const { login, register, checkExistingFarmer, isOnline } = useCustomAuth();
  const mobileService = MobileNumberService.getInstance();

  useEffect(() => {
    // Try to auto-detect mobile number
    const detectMobile = async () => {
      try {
        const detectedNumber = await mobileService.getMobileNumber();
        if (detectedNumber && mobileService.validateMobileNumber(detectedNumber)) {
          setMobileNumber(detectedNumber);
          console.log('Auto-detected mobile number:', detectedNumber);
        }
      } catch (error) {
        console.log('Could not auto-detect mobile number:', error);
      }
    };
    detectMobile();
  }, []);

  const handleMobileNumberChange = (value: string) => {
    // Only allow digits and limit to 10 characters
    const cleaned = value.replace(/\D/g, '').slice(0, 10);
    setMobileNumber(cleaned);
  };

  const handleContinueWithMobile = async () => {
    if (!isOnline) {
      toast.error('You need to be online to continue. Please check your internet connection.');
      return;
    }

    if (!mobileService.validateMobileNumber(mobileNumber)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setCheckingUser(true);
    
    try {
      console.log('Checking if user exists for mobile:', mobileNumber);
      const userExists = await checkExistingFarmer(mobileNumber);
      console.log('User exists check result:', userExists);
      
      setIsExistingUser(userExists);
      
      // Save mobile number to service
      await mobileService.saveMobileNumber(mobileNumber);
      
      if (userExists) {
        setCurrentStep('pin_existing');
        toast.success('Account found! Please enter your PIN to login.');
      } else {
        setCurrentStep('pin_new');
        toast.success('Create a new account by setting up your PIN.');
      }
    } catch (error) {
      console.error('Error checking user existence:', error);
      toast.error('Failed to verify mobile number. Please try again.');
    } finally {
      setCheckingUser(false);
    }
  };

  const handlePinSubmit = async () => {
    if (pin.length !== 4) {
      toast.error('PIN must be exactly 4 digits');
      return;
    }

    if (!isOnline) {
      toast.error('You need to be online to continue. Please check your internet connection.');
      return;
    }

    setLoading(true);

    try {
      console.log('Submitting PIN for:', { mobileNumber, isExistingUser, pinLength: pin.length });
      
      let result;
      if (isExistingUser) {
        // Login existing user
        result = await login(mobileNumber, pin);
        console.log('Login result:', result);
      } else {
        // Register new user
        result = await register(mobileNumber, pin, {
          preferred_language: 'hi',
          full_name: `User_${mobileNumber.slice(-4)}`
        });
        console.log('Registration result:', result);
      }

      if (result.success) {
        toast.success(isExistingUser ? 'Login successful!' : 'Account created successfully!');
        onSuccess();
      } else {
        console.error('Auth failed:', result.error);
        toast.error(result.error || 'Authentication failed. Please try again.');
      }
    } catch (error) {
      console.error('Error during PIN submission:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderPhoneStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center space-y-2">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <Smartphone className="w-8 h-8 text-green-600" />
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">
          Enter Mobile Number
        </CardTitle>
        <p className="text-gray-600">
          We'll check if you have an existing account or help you create a new one
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="mobile" className="text-sm font-medium text-gray-700">
            Mobile Number
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              +91
            </span>
            <Input
              id="mobile"
              type="tel"
              value={mobileNumber}
              onChange={(e) => handleMobileNumberChange(e.target.value)}
              placeholder="Enter 10-digit number"
              className="pl-12 text-lg tracking-wider"
              maxLength={10}
            />
          </div>
          {mobileNumber.length > 0 && (
            <div className="flex items-center text-sm">
              {mobileService.validateMobileNumber(mobileNumber) ? (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Valid mobile number
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <XCircle className="w-4 h-4 mr-1" />
                  Please enter a valid 10-digit number
                </div>
              )}
            </div>
          )}
        </div>

        <Button 
          onClick={handleContinueWithMobile}
          disabled={!mobileService.validateMobileNumber(mobileNumber) || checkingUser || !isOnline}
          className="w-full"
          size="lg"
        >
          {checkingUser ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            'Continue'
          )}
        </Button>

        {!isOnline && (
          <div className="text-center text-sm text-red-600">
            You're offline. Please check your internet connection.
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderPinStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center space-y-2">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">
          {isExistingUser ? 'Enter Your PIN' : 'Create Your PIN'}
        </CardTitle>
        <p className="text-gray-600">
          {isExistingUser 
            ? `Enter your 4-digit PIN for ${mobileNumber}`
            : `Create a secure 4-digit PIN for ${mobileNumber}`
          }
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="text-center">
            <label htmlFor="pin" className="text-sm font-medium text-gray-700 block mb-2">
              4-Digit PIN
            </label>
            <InputOTP 
              value={pin} 
              onChange={setPin} 
              maxLength={4}
              pattern="^[0-9]+$"
            >
              <InputOTPGroup className="gap-3">
                <InputOTPSlot index={0} className="w-12 h-12 text-lg font-bold" />
                <InputOTPSlot index={1} className="w-12 h-12 text-lg font-bold" />
                <InputOTPSlot index={2} className="w-12 h-12 text-lg font-bold" />
                <InputOTPSlot index={3} className="w-12 h-12 text-lg font-bold" />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {!isExistingUser && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> Remember your PIN. You'll need it to access your account.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Button 
            onClick={handlePinSubmit}
            disabled={pin.length !== 4 || loading || !isOnline}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isExistingUser ? 'Signing In...' : 'Creating Account...'}
              </>
            ) : (
              isExistingUser ? 'Sign In' : 'Create Account'
            )}
          </Button>

          <Button 
            variant="outline" 
            onClick={() => setCurrentStep('phone')}
            className="w-full"
            disabled={loading}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Change Mobile Number
          </Button>
        </div>

        {!isOnline && (
          <div className="text-center text-sm text-red-600">
            You're offline. Please check your internet connection.
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Back button */}
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="mb-4"
          disabled={loading || checkingUser}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Progress indicator */}
        <div className="flex items-center justify-center space-x-2 mb-6">
          <div className={`w-3 h-3 rounded-full ${currentStep === 'phone' ? 'bg-green-600' : 'bg-green-200'}`} />
          <div className="w-8 h-0.5 bg-gray-200" />
          <div className={`w-3 h-3 rounded-full ${currentStep !== 'phone' ? 'bg-green-600' : 'bg-gray-200'}`} />
        </div>

        {/* Render current step */}
        {currentStep === 'phone' && renderPhoneStep()}
        {(currentStep === 'pin_new' || currentStep === 'pin_existing') && renderPinStep()}
      </div>
    </div>
  );
};
