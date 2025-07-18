import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { Loader2, Phone, User, CheckCircle, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CustomMobileAuthScreenProps {
  onComplete?: () => void;
}

export const CustomMobileAuthScreen: React.FC<CustomMobileAuthScreenProps> = ({ onComplete }) => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [isExistingUser, setIsExistingUser] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(false);
  
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

  // Auto-check user existence when mobile number is complete
  useEffect(() => {
    const checkUser = async () => {
      if (validateMobileNumber(mobileNumber)) {
        setCheckingUser(true);
        try {
          const exists = await checkExistingFarmer(mobileNumber);
          setIsExistingUser(exists);
        } catch (error) {
          console.error('Error checking farmer:', error);
          setIsExistingUser(null);
        } finally {
          setCheckingUser(false);
        }
      } else {
        setIsExistingUser(null);
      }
    };

    const debounceTimer = setTimeout(checkUser, 500);
    return () => clearTimeout(debounceTimer);
  }, [mobileNumber, checkExistingFarmer]);

  const handleMobileNumberChange = (value: string) => {
    const formatted = formatMobileNumber(value);
    setMobileNumber(formatted);
  };

  const handleAuth = async () => {
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
      if (isExistingUser) {
        // For existing users, we'll use a default PIN for demo purposes
        // In production, you'd have a PIN input screen
        const result = await login(mobileNumber, '1234');
        if (!result.success) {
          toast({
            title: "Login Failed",
            description: "Unable to sign in. Please try again.",
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

  const getButtonText = () => {
    if (loading) {
      return isExistingUser ? 'Signing In...' : 'Creating Account...';
    }
    return isExistingUser ? 'Sign In & Continue' : 'Create Account & Continue';
  };

  const getButtonColor = () => {
    return isExistingUser ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700';
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="min-h-screen flex flex-col px-6">
      {/* Header with logo */}
      <div className="flex items-center justify-between pt-8 pb-6">
        <div className="flex items-center space-x-3">
          <img 
            src="/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png"
            alt="KisanShakti AI"
            className="w-8 h-8 object-contain" 
          />
          <span className="text-xl font-bold text-green-600">KisanShakti Ai</span>
        </div>
        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center border border-gray-100">
          <Sparkles className="w-6 h-6 text-gray-600" />
          <span className="text-xs font-medium text-gray-500 ml-1">Ai</span>
        </div>
      </div>

      {/* Main content - Centered */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md">
          {/* Welcome section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 text-green-600 mb-4">
              <User className="w-6 h-6" />
              <h1 className="text-2xl font-bold text-gray-900">
                {isExistingUser ? 'Welcome Back' : 'Create Account'}
              </h1>
            </div>
            <p className="text-gray-600 text-lg">
              {isExistingUser 
                ? 'Your smart farming journey continues here' 
                : 'Join thousands of farmers using AI for better crops'
              }
            </p>
          </div>

          {/* Mobile number input */}
          <div className="space-y-6">
            <div>
              <label className="text-base font-medium text-gray-700 block mb-3">
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
              <div className={`flex items-center space-x-3 p-4 rounded-xl border ${statusInfo.bg} ${statusInfo.color}`}>
                <statusInfo.icon className={`w-5 h-5 ${checkingUser ? 'animate-spin' : ''}`} />
                <span className="font-medium">{statusInfo.text}</span>
              </div>
            )}

            {/* Action button */}
            <Button
              onClick={handleAuth}
              disabled={!validateMobileNumber(mobileNumber) || loading || checkingUser}
              className={`w-full h-14 text-lg font-semibold rounded-xl text-white ${getButtonColor()}`}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{getButtonText()}</span>
                </div>
              ) : (
                getButtonText()
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom features section */}
      <div className="pb-8 pt-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Smart Farming</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 border-gray-200">
            <CardContent className="p-0 text-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Phone className="w-5 h-5 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-800 text-sm mb-1">AI Chat</h4>
              <p className="text-xs text-gray-600">Get personalized farming advice</p>
            </CardContent>
          </Card>

          <Card className="p-4 border-gray-200">
            <CardContent className="p-0 text-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-800 text-sm mb-1">Community</h4>
              <p className="text-xs text-gray-600">Join thousands of farmers using AI</p>
            </CardContent>
          </Card>

          <Card className="p-4 border-gray-200">
            <CardContent className="p-0 text-center">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-5 h-5 text-yellow-600" />
              </div>
              <h4 className="font-semibold text-gray-800 text-sm mb-1">Smart Farming</h4>
              <p className="text-xs text-gray-600">AI-powered insights</p>
            </CardContent>
          </Card>

          <Card className="p-4 border-gray-200">
            <CardContent className="p-0 text-center">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-5 h-5 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-800 text-sm mb-1">Secure</h4>
              <p className="text-xs text-gray-600">authentication with mobile</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
