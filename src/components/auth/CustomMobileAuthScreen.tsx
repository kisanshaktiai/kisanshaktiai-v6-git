
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { Loader2, Phone, User, CheckCircle, Sparkles, ArrowLeft, UserPlus, LogIn } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

interface CustomMobileAuthScreenProps {
  onComplete?: () => void;
}

type AuthStep = 'phone' | 'login' | 'signup';

export const CustomMobileAuthScreen: React.FC<CustomMobileAuthScreenProps> = ({ onComplete }) => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [isExistingUser, setIsExistingUser] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(false);
  const [userCheckComplete, setUserCheckComplete] = useState(false);
  const [currentStep, setCurrentStep] = useState<AuthStep>('phone');
  
  const { login, register, checkExistingFarmer } = useCustomAuth();
  const { tenantBranding } = useSelector((state: RootState) => state.tenant);

  const logoUrl = tenantBranding?.logo_url || '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png';
  const appName = tenantBranding?.app_name || 'KisanShakti AI';

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

  // Auto-check user existence when mobile number is complete
  useEffect(() => {
    const checkUser = async () => {
      if (validateMobileNumber(mobileNumber)) {
        setCheckingUser(true);
        try {
          const exists = await checkExistingFarmer(mobileNumber);
          setIsExistingUser(exists);
          setUserCheckComplete(true);
          
          // Show feedback toast
          if (exists) {
            toast({
              title: "Welcome back!",
              description: "Account found. Ready to continue",
            });
          } else {
            toast({
              title: "New number detected",
              description: "Ready to create your account",
            });
          }
        } catch (error) {
          console.error('Error checking farmer:', error);
          setIsExistingUser(null);
          setUserCheckComplete(false);
        } finally {
          setCheckingUser(false);
        }
      } else {
        setIsExistingUser(null);
        setUserCheckComplete(false);
      }
    };

    const debounceTimer = setTimeout(checkUser, 500);
    return () => clearTimeout(debounceTimer);
  }, [mobileNumber, checkExistingFarmer]);

  const handleMobileNumberChange = (value: string) => {
    const formatted = formatMobileNumber(value);
    setMobileNumber(formatted);
    setCurrentStep('phone');
  };

  const handleContinueFromPhone = () => {
    if (!validateMobileNumber(mobileNumber) || !userCheckComplete) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      });
      return;
    }

    if (isExistingUser) {
      setCurrentStep('login');
    } else {
      setCurrentStep('signup');
    }
  };

  const handleAuth = async (isLogin: boolean) => {
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
      if (isLogin) {
        // For existing users, we'll use a default PIN for demo purposes
        const result = await login(mobileNumber, '1234');
        if (!result.success) {
          toast({
            title: "Login Failed",
            description: result.error || "Unable to sign in. Please try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "You have been logged in successfully.",
          });
          if (onComplete) {
            onComplete();
          }
        }
      } else {
        // For new users, create account with default PIN
        const result = await register(mobileNumber, '1234');
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
          if (onComplete) {
            onComplete();
          }
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusMessage = () => {
    if (checkingUser) {
      return { text: "Checking...", color: "text-gray-600", bg: "bg-gray-50", icon: Loader2 };
    }
    if (isExistingUser === true) {
      return { 
        text: "Welcome back! Account found", 
        color: "text-blue-700", 
        bg: "bg-blue-50 border-blue-200", 
        icon: CheckCircle 
      };
    }
    if (isExistingUser === false) {
      return { 
        text: "New number detected - Ready to create account", 
        color: "text-green-700", 
        bg: "bg-green-50 border-green-200", 
        icon: User 
      };
    }
    return null;
  };

  const statusInfo = getStatusMessage();

  if (currentStep === 'phone') {
    return (
      <div className="min-h-screen w-full flex flex-col">
        {/* Header with logo */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src={logoUrl}
              alt={appName}
              className="w-8 h-8 object-contain" 
            />
            <span className="text-xl font-bold text-green-600">{appName}</span>
          </div>
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center border border-gray-100">
            <Sparkles className="w-6 h-6 text-gray-600" />
            <span className="text-xs font-medium text-gray-500 ml-1">Ai</span>
          </div>
        </div>

        {/* Main content - Centered */}
        <div className="flex-1 flex items-center justify-center w-full">
          <div className="w-full max-w-md">
            {/* Welcome section */}
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 text-green-600">
                <User className="w-6 h-6" />
                <h1 className="text-2xl font-bold text-gray-900">Welcome</h1>
              </div>
              <p className="text-gray-600 text-lg">
                Enter your mobile number to continue
              </p>
            </div>

            {/* Mobile number input */}
            <div className="space-y-6">
              <div>
                <label className="text-base font-medium text-gray-700 block">
                  Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <Phone className="w-5 h-5 text-gray-400" />
                  </div>
                  <Input
                    type="tel"
                    placeholder="9876543210"
                    value={mobileNumber}
                    onChange={(e) => handleMobileNumberChange(e.target.value)}
                    className="pl-12 h-14 text-lg font-medium rounded-xl border-2 border-gray-200 focus:border-green-500"
                    maxLength={10}
                    disabled={loading}
                  />
                  {checkingUser && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* Status message */}
              {statusInfo && (
                <div className={`flex items-center space-x-3 rounded-xl border ${statusInfo.bg} ${statusInfo.color}`}>
                  <statusInfo.icon className={`w-5 h-5 ${checkingUser ? 'animate-spin' : ''}`} />
                  <span className="font-medium">{statusInfo.text}</span>
                </div>
              )}

              {/* Action button */}
              <Button
                onClick={handleContinueFromPhone}
                disabled={!validateMobileNumber(mobileNumber) || loading || checkingUser || !userCheckComplete}
                className="w-full h-14 text-lg font-semibold rounded-xl text-white bg-green-600 hover:bg-green-700"
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Login Form
  if (currentStep === 'login') {
    return (
      <div className="min-h-screen w-full flex flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src={logoUrl}
              alt={appName}
              className="w-8 h-8 object-contain" 
            />
            <span className="text-xl font-bold text-green-600">{appName}</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center w-full">
          <Card className="w-full max-w-md shadow-xl border-0 bg-white rounded-xl">
            <div className="text-center pt-6 pb-4">
              <div className="flex justify-center items-center gap-4 mb-6">
                <img 
                  src={logoUrl}
                  alt={`${appName} Logo`} 
                  className="w-24 h-24 object-contain drop-shadow-lg" 
                />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
                <LogIn className="w-6 h-6 text-green-600" />
                Welcome Back
              </h1>
              <p className="text-gray-600 mt-2">
                Continue your smart farming journey with {appName}
              </p>
            </div>
            
            <CardContent>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-3 text-gray-700">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="tel"
                      value={mobileNumber}
                      disabled
                      className="text-lg pl-12 border-2 bg-gray-50 text-gray-700 rounded-xl"
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={() => handleAuth(true)}
                  className="w-full text-lg font-semibold bg-blue-600 hover:bg-blue-700 rounded-xl"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    'Sign In & Continue'
                  )}
                </Button>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Not your number?{' '}
                  <button 
                    onClick={() => setCurrentStep('phone')}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Change Number
                  </button>
                </p>
              </div>

              <div className="mt-4 text-center">
                <button 
                  onClick={() => setCurrentStep('phone')}
                  className="text-gray-500 hover:text-gray-700 font-medium flex items-center justify-center gap-1 mx-auto"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Phone Entry
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Signup Form
  if (currentStep === 'signup') {
    return (
      <div className="min-h-screen w-full flex flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src={logoUrl}
              alt={appName}
              className="w-8 h-8 object-contain" 
            />
            <span className="text-xl font-bold text-green-600">{appName}</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center w-full">
          <Card className="w-full max-w-md shadow-xl border-0 bg-white rounded-xl">
            <div className="text-center pt-6 pb-4">
              <div className="flex justify-center items-center gap-3 mb-6">
                <img 
                  src={logoUrl}
                  alt={`${appName} Logo`} 
                  className="w-20 h-20 object-contain drop-shadow-lg" 
                />
                <div className="flex items-center justify-center w-12 h-12 bg-green-600 rounded-full">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
                <UserPlus className="w-6 h-6 text-green-600" />
                Create New Account
              </h1>
              <p className="text-gray-600 mt-2">
                Join thousands of farmers using AI-powered farming guidance
              </p>
            </div>
            
            <CardContent>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-3 text-gray-700">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="tel"
                      value={mobileNumber}
                      disabled
                      className="text-lg pl-12 border-2 bg-gray-50 text-gray-700 rounded-xl"
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={() => handleAuth(false)}
                  className="w-full text-lg font-semibold bg-green-600 hover:bg-green-700 rounded-xl"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Create Account & Continue'
                  )}
                </Button>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Not your number?{' '}
                  <button 
                    onClick={() => setCurrentStep('phone')}
                    className="text-green-600 hover:text-green-700 font-medium"
                  >
                    Change Number
                  </button>
                </p>
              </div>

              <div className="mt-4 text-center">
                <button 
                  onClick={() => setCurrentStep('phone')}
                  className="text-gray-500 hover:text-gray-700 font-medium flex items-center justify-center gap-1 mx-auto"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Phone Entry
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
};
