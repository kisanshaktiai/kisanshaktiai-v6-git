
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { setAuthenticated } from '@/store/slices/authSlice';
import { MobileNumberService, SIMInfo } from '@/services/MobileNumberService';
import { SIMSelectionModal } from './SIMSelectionModal';
import { Phone, Loader, CheckCircle2, Shield, Smartphone, ArrowLeft } from 'lucide-react';
import { RootState } from '@/store';

interface PinAuthScreenProps {
  phone: string;
  onSuccess: () => void;
  onError: (error: string) => void;
  onBack: () => void;
}

type AuthStep = 'detecting' | 'sim-selection' | 'mobile' | 'pin-login' | 'pin-create' | 'success';

export const PinAuthScreen: React.FC<PinAuthScreenProps> = ({ 
  phone: initialPhone, 
  onSuccess, 
  onError, 
  onBack 
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { tenantBranding } = useSelector((state: RootState) => state.tenant);
  
  const [step, setStep] = useState<AuthStep>('pin-login');
  const [mobileNumber, setMobileNumber] = useState(initialPhone.replace('+91', ''));
  const [detectedSIMs, setDetectedSIMs] = useState<SIMInfo[]>([]);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExistingUser, setIsExistingUser] = useState<boolean | null>(null);

  const primaryColor = tenantBranding?.primary_color || '#10B981';
  const appName = tenantBranding?.app_name || 'KisanShakti AI';

  useEffect(() => {
    // Check if user exists when component mounts
    checkUserRegistration(initialPhone);
  }, [initialPhone]);

  const checkUserRegistration = async (number: string) => {
    const formatted = MobileNumberService.getInstance().formatMobileNumber(number);
    const isRegistered = await MobileNumberService.getInstance().isRegisteredUser(formatted);
    setIsExistingUser(isRegistered);
    setStep(isRegistered ? 'pin-login' : 'pin-create');
  };

  const handleLogin = async () => {
    if (pin.length !== 4) {
      const errorMsg = 'PIN must be 4 digits';
      setError(errorMsg);
      onError(errorMsg);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formatted = `+91${mobileNumber}`;
      const result = await MobileNumberService.getInstance().authenticateWithPin(formatted, pin);
      
      if (result.success) {
        dispatch(setAuthenticated({
          userId: result.userId!,
          phoneNumber: formatted
        }));
        
        setStep('success');
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        const errorMsg = result.error || 'Login failed';
        setError(errorMsg);
        onError(errorMsg);
      }
    } catch (error) {
      const errorMsg = 'Login failed. Please try again.';
      setError(errorMsg);
      onError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePin = async () => {
    if (pin.length !== 4 || confirmPin.length !== 4) {
      const errorMsg = 'PIN must be 4 digits';
      setError(errorMsg);
      onError(errorMsg);
      return;
    }

    if (pin !== confirmPin) {
      const errorMsg = 'PINs do not match';
      setError(errorMsg);
      onError(errorMsg);
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
          userId: result.userId!,
          phoneNumber: formatted
        }));
        
        setStep('success');
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        const errorMsg = result.error || 'Registration failed';
        setError(errorMsg);
        onError(errorMsg);
      }
    } catch (error) {
      const errorMsg = 'Registration failed. Please try again.';
      setError(errorMsg);
      onError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const renderPinLoginStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="p-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1" />
      </div>

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
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="p-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1" />
      </div>

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        {step === 'pin-login' && renderPinLoginStep()}
        {step === 'pin-create' && renderPinCreateStep()}
        {step === 'success' && renderSuccessStep()}
      </div>
    </div>
  );
};
