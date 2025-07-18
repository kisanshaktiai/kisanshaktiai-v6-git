import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { setAuthenticated } from '@/store/slices/authSlice';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { Phone, Loader, CheckCircle2, Shield, Smartphone } from 'lucide-react';
import { RootState } from '@/store';
import { VoiceEnabledInput } from './VoiceEnabledInput';

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
  const [error, setError] = useState<string | null>(null);
  const [isExistingUser, setIsExistingUser] = useState<boolean | null>(null);

  const { login, register, checkExistingFarmer } = useCustomAuth();

  const primaryColor = tenantBranding?.primary_color || '#10B981';
  const appName = tenantBranding?.app_name || 'KisanShakti AI';

  const checkUserRegistration = async (number: string) => {
    const formatted = number.replace(/\D/g, '');
    if (formatted.length === 10) {
      const isRegistered = await checkExistingFarmer(formatted);
      setIsExistingUser(isRegistered);
    }
  };

  const handleMobileNumberChange = async (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      setMobileNumber(cleaned);
      setError(null);
      setIsExistingUser(null);

      if (cleaned.length === 10) {
        await checkUserRegistration(cleaned);
      }
    }
  };

  const handleMobileSubmit = () => {
    if (mobileNumber.length !== 10) {
      setError('कृपया वैध 10 अंकों का मोबाइल नंबर दर्ज करें');
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
      setError('PIN में 4 अंक होने चाहिए');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await login(mobileNumber, pin);
      
      if (result.success) {
        dispatch(setAuthenticated({
          userId: result.farmer!.id,
          phoneNumber: `+91${mobileNumber}`
        }));
        
        setStep('success');
        setTimeout(() => {
          onComplete();
        }, 2000);
      } else {
        setError(result.error || 'लॉगिन विफल');
      }
    } catch (error) {
      setError('लॉगिन विफल। कृपया पुनः प्रयास करें।');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePin = async () => {
    if (pin.length !== 4 || confirmPin.length !== 4) {
      setError('PIN में 4 अंक होने चाहिए');
      return;
    }

    if (pin !== confirmPin) {
      setError('PIN मेल नहीं खाते');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await register(mobileNumber, pin, {
        fullName: 'User', // Default name, will be updated later
      });
      
      if (result.success) {
        dispatch(setAuthenticated({
          userId: result.farmer!.id,
          phoneNumber: `+91${mobileNumber}`
        }));
        
        setStep('success');
        setTimeout(() => {
          onComplete();
        }, 2000);
      } else {
        setError(result.error || 'पंजीकरण विफल');
      }
    } catch (error) {
      setError('पंजीकरण विफल। कृपया पुनः प्रयास करें।');
    } finally {
      setLoading(false);
    }
  };

  const renderDetectingStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div 
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg"
          style={{ backgroundColor: `${primaryColor}15`, border: `2px solid ${primaryColor}` }}
        >
          <Smartphone className="w-10 h-10 animate-pulse" style={{ color: primaryColor }} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Detecting Mobile Number
        </h1>
        <p className="text-gray-600 text-base">
          Checking for SIM cards on your device...
        </p>
        <div className="flex items-center justify-center space-x-2">
          <Loader className="w-4 h-4 animate-spin" style={{ color: primaryColor }} />
          <span className="text-sm text-gray-500">Please wait</span>
        </div>
      </div>
    </div>
  );

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
          Welcome to {appName}
        </h1>
        <p className="text-gray-600 text-base leading-relaxed px-4">
          अपना मोबाइल नंबर दर्ज करें
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 block">
            Mobile Number
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
              <span className="text-gray-500 text-base">🇮🇳</span>
              <span className="text-gray-600 font-medium">+91</span>
              <div className="w-px h-5 bg-gray-300"></div>
            </div>
            <VoiceEnabledInput
              type="tel"
              placeholder="9876543210"
              value={mobileNumber}
              onChange={handleMobileNumberChange}
              className="pl-20 h-14 text-lg font-medium text-center tracking-wider"
              maxLength={10}
              autoFocus
            />
          </div>
        </div>

        {isExistingUser !== null && (
          <div className={`text-sm text-center p-3 rounded-lg border ${
            isExistingUser 
              ? 'bg-green-50 text-green-800 border-green-200' 
              : 'bg-blue-50 text-blue-800 border-blue-200'
          }`}>
            {isExistingUser ? 'स्वागत वापसी! कृपया अपना PIN दर्ज करें।' : 'नया उपयोगकर्ता - हम आपका खाता बनाएंगे।'}
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
          {isExistingUser ? 'लॉगिन के लिए जारी रखें' : 'पंजीकरण के लिए जारी रखें'}
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
          <VoiceEnabledInput
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
          <VoiceEnabledInput
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
          <VoiceEnabledInput
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
        {step === 'mobile' && (
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg"
                style={{ backgroundColor: `${primaryColor}15`, border: `2px solid ${primaryColor}` }}
              >
                <Phone className="w-10 h-10" style={{ color: primaryColor }} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome to {appName}
              </h1>
              <p className="text-gray-600 text-base leading-relaxed px-4">
                अपना मोबाइल नंबर दर्ज करें
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block">
                  Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                    <span className="text-gray-500 text-base">🇮🇳</span>
                    <span className="text-gray-600 font-medium">+91</span>
                    <div className="w-px h-5 bg-gray-300"></div>
                  </div>
                  <VoiceEnabledInput
                    type="tel"
                    placeholder="9876543210"
                    value={mobileNumber}
                    onChange={handleMobileNumberChange}
                    className="pl-20 h-14 text-lg font-medium text-center tracking-wider"
                    maxLength={10}
                    autoFocus
                  />
                </div>
              </div>

              {isExistingUser !== null && (
                <div className={`text-sm text-center p-3 rounded-lg border ${
                  isExistingUser 
                    ? 'bg-green-50 text-green-800 border-green-200' 
                    : 'bg-blue-50 text-blue-800 border-blue-200'
                }`}>
                  {isExistingUser ? 'स्वागत वापसी! कृपया अपना PIN दर्ज करें।' : 'नया उपयोगकर्ता - हम आपका खाता बनाएंगे।'}
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
                {isExistingUser ? 'लॉगिन के लिए जारी रखें' : 'पंजीकरण के लिए जारी रखें'}
              </Button>
            </div>
          </div>
        )}

        {step === 'pin-login' && (
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
                <VoiceEnabledInput
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
        )}

        {step === 'pin-create' && (
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
                <VoiceEnabledInput
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
                <VoiceEnabledInput
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
        )}

        {step === 'success' && renderSuccessStep()}
      </div>
    </div>
  );
};
