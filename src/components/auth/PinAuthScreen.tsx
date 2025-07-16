
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { setAuthenticated } from '@/store/slices/authSlice';
import { MobileNumberService } from '@/services/MobileNumberService';
import { Phone, Loader, CheckCircle2, Shield } from 'lucide-react';
import { RootState } from '@/store';

interface PinAuthScreenProps {
  onComplete: () => void;
}

type AuthStep = 'mobile' | 'pin-login' | 'pin-create' | 'success';

export const PinAuthScreen: React.FC<PinAuthScreenProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { tenantBranding } = useSelector((state: RootState) => state.tenant);
  
  const [step, setStep] = useState<AuthStep>('mobile');
  const [mobileNumber, setMobileNumber] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoDetecting, setAutoDetecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExistingUser, setIsExistingUser] = useState<boolean | null>(null);

  const primaryColor = tenantBranding?.primary_color || '#10B981';
  const appName = tenantBranding?.app_name || 'KisanShakti AI';

  useEffect(() => {
    autoDetectMobileNumber();
  }, []);

  const autoDetectMobileNumber = async () => {
    setAutoDetecting(true);
    try {
      const detectedNumber = await MobileNumberService.getInstance().getMobileNumber();
      if (detectedNumber) {
        setMobileNumber(detectedNumber.replace('+91', ''));
        await checkUserRegistration(detectedNumber);
      }
    } catch (error) {
      console.error('Auto-detection failed:', error);
    } finally {
      setAutoDetecting(false);
    }
  };

  const checkUserRegistration = async (number: string) => {
    const formatted = MobileNumberService.getInstance().formatMobileNumber(number);
    const isRegistered = await MobileNumberService.getInstance().isRegisteredUser(formatted);
    setIsExistingUser(isRegistered);
  };

  const handleMobileNumberChange = async (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      setMobileNumber(cleaned);
      setError(null);
      setIsExistingUser(null);

      if (cleaned.length === 10) {
        const formatted = `+91${cleaned}`;
        await checkUserRegistration(formatted);
      }
    }
  };

  const handleMobileSubmit = () => {
    if (mobileNumber.length !== 10) {
      setError(t('auth.invalid_mobile'));
      return;
    }

    if (isExistingUser) {
      setStep('pin-login');
    } else {
      setStep('pin-create');
    }
  };

  const handleLogin = async () => {
    if (pin.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formatted = `+91${mobileNumber}`;
      const result = await MobileNumberService.getInstance().authenticateWithPin(formatted, pin);
      
      if (result.success) {
        dispatch(setAuthenticated({
          phoneNumber: formatted,
          deviceId: 'device_id',
          token: 'auth_token',
          userId: result.userId
        }));
        
        setStep('success');
        setTimeout(() => {
          onComplete();
        }, 2000);
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePin = async () => {
    if (pin.length !== 4 || confirmPin.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }

    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formatted = `+91${mobileNumber}`;
      const result = await MobileNumberService.getInstance().registerUser(formatted, pin, {
        fullName: 'User', // Default name, will be updated in profile
      });
      
      if (result.success) {
        dispatch(setAuthenticated({
          phoneNumber: formatted,
          deviceId: 'device_id',
          token: 'auth_token',
          userId: result.userId
        }));
        
        setStep('success');
        setTimeout(() => {
          onComplete();
        }, 2000);
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (error) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderMobileStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div 
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg"
          style={{ backgroundColor: `${primaryColor}15`, border: `2px solid ${primaryColor}` }}
        >
          <Phone className="w-10 h-10" style={{ color: primaryColor }} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t('auth.welcome_to')} {appName}
        </h1>
        <p className="text-gray-600 text-base leading-relaxed px-4">
          Enter your mobile number to continue
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 block">
            {t('auth.mobile_number')}
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
              <span className="text-gray-500 text-base">🇮🇳</span>
              <span className="text-gray-600 font-medium">+91</span>
              <div className="w-px h-5 bg-gray-300"></div>
            </div>
            <Input
              type="tel"
              placeholder="9876543210"
              value={mobileNumber}
              onChange={(e) => handleMobileNumberChange(e.target.value)}
              className="pl-20 h-14 text-lg font-medium text-center tracking-wider"
              maxLength={10}
            />
          </div>
        </div>

        {isExistingUser !== null && (
          <div className={`text-sm text-center p-3 rounded-lg border ${
            isExistingUser 
              ? 'bg-green-50 text-green-800 border-green-200' 
              : 'bg-blue-50 text-blue-800 border-blue-200'
          }`}>
            {isExistingUser ? 'Welcome back! Please enter your PIN.' : 'New user - we\'ll create your account.'}
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 text-center p-3 bg-red-50 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <Button 
          onClick={handleMobileSubmit}
          disabled={mobileNumber.length !== 10 || loading}
          className="w-full h-14 text-lg font-semibold rounded-xl"
          style={{ backgroundColor: primaryColor }}
        >
          {isExistingUser ? 'Continue to Login' : 'Continue to Register'}
        </Button>
      </div>
    </div>
  );

  const renderPinLoginStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div 
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg"
          style={{ backgroundColor: `${primaryColor}15`, border: `2px solid ${primaryColor}` }}
        >
          <Shield className="w-10 h-10" style={{ color: primaryColor }} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome Back!</h1>
        <p className="text-gray-600 text-base">
          Enter your 4-digit PIN for <span className="font-semibold">+91 {mobileNumber}</span>
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 block text-center">
            Enter PIN
          </label>
          <Input
            type="password"
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            className="h-14 text-2xl font-bold text-center tracking-[0.5em] placeholder:tracking-normal"
            maxLength={4}
          />
        </div>

        {error && (
          <div className="text-sm text-red-600 text-center p-3 bg-red-50 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <Button 
          onClick={handleLogin}
          disabled={pin.length !== 4 || loading}
          className="w-full h-14 text-lg font-semibold rounded-xl"
          style={{ backgroundColor: primaryColor }}
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <Loader className="w-5 h-5 animate-spin" />
              <span>Logging in...</span>
            </div>
          ) : (
            'Login'
          )}
        </Button>
      </div>
    </div>
  );

  const renderPinCreateStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div 
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg"
          style={{ backgroundColor: `${primaryColor}15`, border: `2px solid ${primaryColor}` }}
        >
          <Shield className="w-10 h-10" style={{ color: primaryColor }} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Create PIN</h1>
        <p className="text-gray-600 text-base">
          Set a 4-digit PIN for secure access
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 block">
            Create PIN
          </label>
          <Input
            type="password"
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            className="h-14 text-2xl font-bold text-center tracking-[0.5em] placeholder:tracking-normal"
            maxLength={4}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 block">
            Confirm PIN
          </label>
          <Input
            type="password"
            placeholder="••••"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            className="h-14 text-2xl font-bold text-center tracking-[0.5em] placeholder:tracking-normal"
            maxLength={4}
          />
        </div>

        {error && (
          <div className="text-sm text-red-600 text-center p-3 bg-red-50 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <Button 
          onClick={handleCreatePin}
          disabled={pin.length !== 4 || confirmPin.length !== 4 || loading}
          className="w-full h-14 text-lg font-semibold rounded-xl"
          style={{ backgroundColor: primaryColor }}
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <Loader className="w-5 h-5 animate-spin" />
              <span>Creating Account...</span>
            </div>
          ) : (
            'Create Account'
          )}
        </Button>
      </div>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="relative">
          <div 
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-lg animate-pulse"
            style={{ backgroundColor: `${primaryColor}15`, border: `2px solid ${primaryColor}` }}
          >
            <CheckCircle2 className="w-12 h-12 text-green-600 animate-bounce" />
          </div>
          <div className="absolute inset-0 w-24 h-24 rounded-full mx-auto animate-ping" 
               style={{ backgroundColor: `${primaryColor}20` }}></div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isExistingUser ? 'Welcome Back!' : 'Account Created!'}
        </h1>
        <p className="text-gray-600 text-base">
          {isExistingUser ? 'Login successful' : 'Your account has been created successfully'}
        </p>
      </div>
    </div>
  );

  if (autoDetecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4 mx-auto">
            <Phone className="w-8 h-8 text-white animate-pulse" />
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        {step === 'mobile' && renderMobileStep()}
        {step === 'pin-login' && renderPinLoginStep()}
        {step === 'pin-create' && renderPinCreateStep()}
        {step === 'success' && renderSuccessStep()}
      </div>
    </div>
  );
};
