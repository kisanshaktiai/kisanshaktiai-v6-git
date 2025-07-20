import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Smartphone, Lock, CheckCircle, AlertCircle, UserPlus, LogIn, Loader } from 'lucide-react';
import { useBranding } from '@/contexts/BrandingContext';
import { useCustomAuth } from '@/hooks/useCustomAuth';

interface EnhancedPhoneAuthScreenProps {
  onComplete: () => void;
}

type AuthStep = 'phone' | 'pin-login' | 'pin-create' | 'success';
type UserStatus = 'checking' | 'existing' | 'new' | null;

export const EnhancedPhoneAuthScreen: React.FC<EnhancedPhoneAuthScreenProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const { branding } = useBranding();
  const { login, register, checkExistingFarmer } = useCustomAuth();
  
  const [step, setStep] = useState<AuthStep>('phone');
  const [mobileNumber, setMobileNumber] = useState('9898989495'); // Updated default number
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [userStatus, setUserStatus] = useState<UserStatus>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateMobileNumber = (mobile: string): boolean => {
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(mobile);
  };

  const checkUserExists = async (mobile: string) => {
    try {
      setUserStatus('checking');
      setError(null);
      
      const exists = await checkExistingFarmer(mobile);
      setUserStatus(exists ? 'existing' : 'new');
      
      return exists;
    } catch (err) {
      console.error('Error checking user:', err);
      setError(t('auth.error_checking_user'));
      setUserStatus(null);
      return false;
    }
  };

  // Auto-check user status when component mounts with default number
  useEffect(() => {
    if (mobileNumber === '9898989495') {
      checkUserExists(mobileNumber);
    }
  }, []);

  const handleMobileSubmit = async () => {
    if (!validateMobileNumber(mobileNumber)) {
      setError(t('auth.invalid_mobile'));
      return;
    }

    setLoading(true);

    try {
      const userExists = await checkUserExists(mobileNumber);
      
      if (userExists) {
        setStep('pin-login');
      } else {
        setStep('pin-create');
      }
    } catch (err) {
      console.error('Mobile submission error:', err);
      setError(t('auth.something_went_wrong'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (pin.length !== 4) {
      setError(t('auth.pin_required'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await login(mobileNumber, pin);
      
      if (result.success) {
        setStep('success');
        setTimeout(() => {
          onComplete();
        }, 2000);
      } else {
        setError(result.error || t('auth.login_failed'));
      }
    } catch (err) {
      setError(t('auth.login_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (pin.length !== 4 || confirmPin.length !== 4) {
      setError(t('auth.pin_required'));
      return;
    }

    if (pin !== confirmPin) {
      setError(t('auth.pins_dont_match'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await register(mobileNumber, pin);
      
      if (result.success) {
        setStep('success');
        setTimeout(() => {
          onComplete();
        }, 2000);
      } else {
        setError(result.error || t('auth.registration_failed'));
      }
    } catch (err) {
      setError(t('auth.registration_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('phone');
    setPin('');
    setConfirmPin('');
    setError(null);
    setUserStatus(null);
  };

  const renderHeader = () => {
    const getHeaderContent = () => {
      switch (step) {
        case 'pin-login':
          return {
            title: t('auth.welcome_back'),
            subtitle: t('auth.welcome_back_subtitle'),
            icon: LogIn
          };
        case 'pin-create':
          return {
            title: t('auth.create_account'),
            subtitle: t('auth.create_account_subtitle'),
            icon: UserPlus
          };
        case 'success':
          return {
            title: userStatus === 'existing' ? t('auth.login_success') : t('auth.account_created'),
            subtitle: t('auth.welcome_to_app', { appName: branding.appName }),
            icon: CheckCircle
          };
        default:
          return {
            title: t('auth.welcome'),
            subtitle: branding.tagline,
            icon: Smartphone
          };
      }
    };

    const headerContent = getHeaderContent();
    const IconComponent = headerContent.icon;

    return (
      <div className="text-center pb-3">
        <div className="flex justify-center items-center mb-3">
          <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center border border-gray-100">
            <img 
              src={branding.logo}
              alt={branding.appName}
              className="w-8 h-8 object-contain" 
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
          </div>
        </div>
        
        <h1 className="text-xl font-bold mb-2 flex items-center justify-center gap-2"
            style={{ color: branding.primaryColor }}>
          <IconComponent className="w-5 h-5" />
          {headerContent.title}
        </h1>
        
        <p className="text-gray-600 text-sm leading-relaxed px-1">
          {headerContent.subtitle}
        </p>
      </div>
    );
  };

  const renderPhoneStep = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 block">
          {t('auth.mobile_number')}
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            <span className="text-gray-500 text-base">🇮🇳</span>
            <span className="text-gray-600 font-medium">+91</span>
            <div className="w-px h-5 bg-gray-300"></div>
          </div>
          <Input
            type="tel"
            placeholder="9898989495"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
            className="pl-16 h-12 text-base font-medium text-center tracking-wider border-2 rounded-xl"
            maxLength={10}
          />
          {userStatus === 'checking' && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          )}
        </div>
      </div>

      {userStatus && userStatus !== 'checking' && (
        <div className={`text-sm text-center p-3 rounded-lg border-2 ${
          userStatus === 'existing' 
            ? 'bg-blue-50 text-blue-800 border-blue-200' 
            : 'bg-green-50 text-green-800 border-green-200'
        }`}>
          <div className="flex items-center justify-center gap-2">
            {userStatus === 'existing' ? (
              <>
                <CheckCircle className="w-4 h-4" />
                {t('auth.welcome_back_account_found')}
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                {t('auth.new_number_detected')}
              </>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 text-center p-3 bg-red-50 rounded-lg border border-red-200 flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <Button 
        onClick={handleMobileSubmit}
        disabled={mobileNumber.length !== 10 || loading || userStatus === 'checking'}
        className="w-full h-12 text-base font-semibold rounded-xl transition-all duration-200"
        style={{ 
          backgroundColor: mobileNumber.length === 10 && !loading ? branding.primaryColor : '#9CA3AF',
          color: 'white'
        }}
      >
        {loading ? (
          <div className="flex items-center space-x-2">
            <Loader className="w-4 h-4 animate-spin" />
            <span>{t('common.loading')}</span>
          </div>
        ) : userStatus === 'existing' ? (
          t('auth.continue_to_login')
        ) : userStatus === 'new' ? (
          t('auth.create_account_continue')
        ) : (
          t('common.continue')
        )}
      </Button>
    </div>
  );

  const renderPinLoginStep = () => (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <p className="text-gray-600">
          {t('auth.enter_pin_for')} <span className="font-semibold">+91 {mobileNumber}</span>
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 block text-center">
            {t('auth.enter_pin')}
          </label>
          <Input
            type="password"
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            className="h-12 text-2xl font-bold text-center tracking-[0.5em] placeholder:tracking-normal border-2 rounded-xl"
            maxLength={4}
          />
        </div>

        {error && (
          <div className="text-sm text-red-600 text-center p-3 bg-red-50 rounded-lg border border-red-200 flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="space-y-3">
          <Button 
            onClick={handleLogin}
            disabled={pin.length !== 4 || loading}
            className="w-full h-12 text-base font-semibold rounded-xl"
            style={{ backgroundColor: branding.primaryColor, color: 'white' }}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <Loader className="w-4 h-4 animate-spin" />
                <span>{t('auth.signing_in')}</span>
              </div>
            ) : (
              t('auth.sign_in_continue')
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={loading}
            className="w-full h-10 border-2 rounded-xl"
          >
            {t('common.back')}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderPinCreateStep = () => (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <p className="text-gray-600">
          {t('auth.create_secure_pin')}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 block">
            {t('auth.create_pin')}
          </label>
          <Input
            type="password"
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            className="h-12 text-2xl font-bold text-center tracking-[0.5em] placeholder:tracking-normal border-2 rounded-xl"
            maxLength={4}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 block">
            {t('auth.confirm_pin')}
          </label>
          <Input
            type="password"
            placeholder="••••"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            className="h-12 text-2xl font-bold text-center tracking-[0.5em] placeholder:tracking-normal border-2 rounded-xl"
            maxLength={4}
          />
        </div>

        {error && (
          <div className="text-sm text-red-600 text-center p-3 bg-red-50 rounded-lg border border-red-200 flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="space-y-3">
          <Button 
            onClick={handleRegister}
            disabled={pin.length !== 4 || confirmPin.length !== 4 || loading}
            className="w-full h-12 text-base font-semibold rounded-xl"
            style={{ backgroundColor: branding.primaryColor, color: 'white' }}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <Loader className="w-4 h-4 animate-spin" />
                <span>{t('auth.creating_account')}</span>
              </div>
            ) : (
              t('auth.create_account_continue')
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={loading}
            className="w-full h-10 border-2 rounded-xl"
          >
            {t('common.back')}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="space-y-4">
      <div className="text-center space-y-4">
        <div className="relative">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg animate-pulse"
            style={{ backgroundColor: `${branding.primaryColor}15`, border: `2px solid ${branding.primaryColor}` }}
          >
            <CheckCircle className="w-10 h-10 text-green-600 animate-bounce" />
          </div>
          <div className="absolute inset-0 w-20 h-20 rounded-full mx-auto animate-ping" 
               style={{ backgroundColor: `${branding.primaryColor}20` }}></div>
        </div>
        <div>
          <p className="text-gray-600">
            {t('auth.redirecting_to_app')}
          </p>
        </div>
      </div>
    </div>
  );

  const renderFeatures = () => (
    <div className="mt-4">
      <h3 className="text-center text-sm font-semibold text-gray-800 mb-3">
        {t('auth.smart_farming')}
      </h3>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center"
               style={{ backgroundColor: `${branding.primaryColor}15` }}>
            <svg className="w-4 h-4" style={{ color: branding.primaryColor }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <h4 className="font-semibold text-gray-800 text-xs mb-1">{t('features.ai_chat')}</h4>
          <p className="text-xs text-gray-600">{t('features.ai_chat_desc')}</p>
        </div>

        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center"
               style={{ backgroundColor: `${branding.primaryColor}15` }}>
            <svg className="w-4 h-4" style={{ color: branding.primaryColor }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
            </svg>
          </div>
          <h4 className="font-semibold text-gray-800 text-xs mb-1">{t('features.community')}</h4>
          <p className="text-xs text-gray-600">{t('features.community_desc')}</p>
        </div>

        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center"
               style={{ backgroundColor: `${branding.primaryColor}15` }}>
            <svg className="w-4 h-4" style={{ color: branding.primaryColor }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
            </svg>
          </div>
          <h4 className="font-semibold text-gray-800 text-xs mb-1">{t('features.smart_farming')}</h4>
          <p className="text-xs text-gray-600">{t('features.smart_farming_desc')}</p>
        </div>

        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center"
               style={{ backgroundColor: `${branding.primaryColor}15` }}>
            <svg className="w-4 h-4" style={{ color: branding.primaryColor }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
          </div>
          <h4 className="font-semibold text-gray-800 text-xs mb-1">{t('features.secure')}</h4>
          <p className="text-xs text-gray-600">{t('features.secure_desc')}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-1">
      <Card className="w-full max-w-sm bg-white shadow-2xl border-0 rounded-2xl overflow-hidden">
        <CardHeader className="pb-0 px-3 pt-3">
          {renderHeader()}
        </CardHeader>
        
        <CardContent className="px-3 pb-3">
          {step === 'phone' && renderPhoneStep()}
          {step === 'pin-login' && renderPinLoginStep()}
          {step === 'pin-create' && renderPinCreateStep()}
          {step === 'success' && renderSuccessStep()}
          
          {step === 'phone' && renderFeatures()}
        </CardContent>
      </Card>
    </div>
  );
};
