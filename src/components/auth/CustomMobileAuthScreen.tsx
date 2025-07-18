
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { Loader2, Phone, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CustomMobileAuthScreenProps {
  onComplete?: () => void;
}

export const CustomMobileAuthScreen: React.FC<CustomMobileAuthScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState<'mobile' | 'pin' | 'register'>('mobile');
  const [mobileNumber, setMobileNumber] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { login, register, checkExistingFarmer } = useCustomAuth();

  const formatMobileNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      return cleaned;
    }
    return cleaned.substring(0, 10);
  };

  const validateMobileNumber = (mobile: string) => {
    const cleaned = mobile.replace(/\D/g, '');
    return cleaned.length === 10 && /^[6-9]/.test(cleaned);
  };

  const validatePin = (pinValue: string) => {
    return /^\d{4}$/.test(pinValue);
  };

  const handleMobileSubmit = async () => {
    if (!validateMobileNumber(mobileNumber)) {
      toast({
        title: "Invalid Mobile Number",
        description: "Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const exists = await checkExistingFarmer(mobileNumber);
      if (exists) {
        setStep('pin');
      } else {
        setStep('register');
      }
    } catch (error) {
      console.error('Error checking farmer:', error);
      toast({
        title: "Error",
        description: "Failed to verify mobile number. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!validatePin(pin)) {
      toast({
        title: "Invalid PIN",
        description: "PIN must be exactly 4 digits",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await login(mobileNumber, pin);
      if (!result.success) {
        toast({
          title: "Login Failed",
          description: result.error || "Invalid mobile number or PIN",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "You have been logged in successfully.",
        });
        // Call onComplete if provided
        if (onComplete) {
          onComplete();
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!validatePin(pin)) {
      toast({
        title: "Invalid PIN",
        description: "PIN must be exactly 4 digits",
        variant: "destructive",
      });
      return;
    }

    if (!validatePin(confirmPin)) {
      toast({
        title: "Invalid Confirm PIN",
        description: "Confirm PIN must be exactly 4 digits",
        variant: "destructive",
      });
      return;
    }

    if (pin !== confirmPin) {
      toast({
        title: "PIN Mismatch",
        description: "PIN and confirm PIN must match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await register(mobileNumber, pin);
      if (!result.success) {
        toast({
          title: "Registration Failed",
          description: result.error || "Failed to create account. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Account Created!",
          description: "Your account has been created successfully.",
        });
        // Call onComplete if provided
        if (onComplete) {
          onComplete();
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'pin' || step === 'register') {
      setStep('mobile');
      setPin('');
      setConfirmPin('');
    }
  };

  const handlePinChange = (value: string, setter: (value: string) => void) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 4) {
      setter(cleaned);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            {(step === 'pin' || step === 'register') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="absolute left-4"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              {step === 'mobile' ? (
                <Phone className="w-6 h-6 text-green-600" />
              ) : (
                <Lock className="w-6 h-6 text-green-600" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            {step === 'mobile' && 'Enter Mobile Number'}
            {step === 'pin' && 'Enter Your PIN'}
            {step === 'register' && 'Create Your PIN'}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {step === 'mobile' && (
            <>
              <div className="space-y-2">
                <label htmlFor="mobile" className="text-sm font-medium">
                  Mobile Number
                </label>
                <div className="relative">
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="Enter 10-digit mobile number"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(formatMobileNumber(e.target.value))}
                    className="pl-8"
                    disabled={loading}
                  />
                  <Phone className="absolute left-2 top-3 h-4 w-4 text-gray-400" />
                </div>
              </div>
              <Button
                onClick={handleMobileSubmit}
                className="w-full"
                disabled={loading || !validateMobileNumber(mobileNumber)}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
            </>
          )}

          {step === 'pin' && (
            <>
              <div className="space-y-2">
                <label htmlFor="pin" className="text-sm font-medium">
                  Enter 4-digit PIN
                </label>
                <div className="relative">
                  <Input
                    id="pin"
                    type={showPin ? "text" : "password"}
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => handlePinChange(e.target.value, setPin)}
                    className="pl-8 pr-8 text-center tracking-widest"
                    maxLength={4}
                    disabled={loading}
                  />
                  <Lock className="absolute left-2 top-3 h-4 w-4 text-gray-400" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-8 w-8 p-0"
                    onClick={() => setShowPin(!showPin)}
                  >
                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button
                onClick={handleLogin}
                className="w-full"
                disabled={loading || !validatePin(pin)}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </Button>
            </>
          )}

          {step === 'register' && (
            <>
              <div className="space-y-2">
                <label htmlFor="new-pin" className="text-sm font-medium">
                  Create 4-digit PIN
                </label>
                <div className="relative">
                  <Input
                    id="new-pin"
                    type={showPin ? "text" : "password"}
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => handlePinChange(e.target.value, setPin)}
                    className="pl-8 pr-8 text-center tracking-widest"
                    maxLength={4}
                    disabled={loading}
                  />
                  <Lock className="absolute left-2 top-3 h-4 w-4 text-gray-400" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-8 w-8 p-0"
                    onClick={() => setShowPin(!showPin)}
                  >
                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirm-pin" className="text-sm font-medium">
                  Confirm PIN
                </label>
                <div className="relative">
                  <Input
                    id="confirm-pin"
                    type={showConfirmPin ? "text" : "password"}
                    placeholder="••••"
                    value={confirmPin}
                    onChange={(e) => handlePinChange(e.target.value, setConfirmPin)}
                    className="pl-8 pr-8 text-center tracking-widest"
                    maxLength={4}
                    disabled={loading}
                  />
                  <Lock className="absolute left-2 top-3 h-4 w-4 text-gray-400" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-8 w-8 p-0"
                    onClick={() => setShowConfirmPin(!showConfirmPin)}
                  >
                    {showConfirmPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleRegister}
                className="w-full"
                disabled={loading || !validatePin(pin) || !validatePin(confirmPin) || pin !== confirmPin}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </>
          )}

          <div className="text-center text-sm text-gray-500">
            {step === 'mobile' && (
              <p>Enter your mobile number to login or create a new account</p>
            )}
            {step === 'pin' && (
              <p>Welcome back! Enter your 4-digit PIN to continue</p>
            )}
            {step === 'register' && (
              <p>You're new here! Create a secure 4-digit PIN for your account</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
