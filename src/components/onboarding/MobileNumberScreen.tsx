
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { setAuthenticated, setOnboardingCompleted } from '@/store/slices/authSlice';
import { MobileNumberService } from '@/services/MobileNumberService';
import { useBranding } from '@/contexts/BrandingContext';
import { 
  Phone, 
  Smartphone, 
  Loader, 
  CheckCircle, 
  AlertCircle, 
  WifiOff, 
  Wifi 
} from 'lucide-react';

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
  const { branding } = useBranding();
  
  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoDetecting, setAutoDetecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExistingUser, setIsExistingUser] = useState<boolean | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    autoDetectMobileNumber();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const autoDetectMobileNumber = async () => {
    setAutoDetecting(true);
    try {
      const detectedNumber = await MobileNumberService.getInstance().getMobileNumber();
      if (detectedNumber) {
        setMobileNumber(detectedNumber);
        // Check if user is already registered
        const isRegistered = await MobileNumberService.getInstance().isRegisteredUser(detectedNumber);
        setIsExistingUser(isRegistered);
      }
    } catch (error) {
      console.error('Auto-detection failed:', error);
    } finally {
      setAutoDetecting(false);
    }
  };

  const handleMobileNumberChange = async (value: string) => {
    setMobileNumber(value);
    setError(null);
    setIsExistingUser(null);

    // Format and validate as user types
    if (value.length >= 10) {
      const formatted = MobileNumberService.getInstance().formatMobileNumber(value);
      if (MobileNumberService.getInstance().validateMobileNumber(formatted)) {
        try {
          // Check if user exists
          const isRegistered = await MobileNumberService.getInstance().isRegisteredUser(formatted);
          setIsExistingUser(isRegistered);
        } catch (error) {
          console.error('Error checking user registration:', error);
        }
      }
    }
  };

  const handleContinue = async () => {
    if (!mobileNumber) {
      setError(t('auth.please_enter_mobile'));
      return;
    }

    const formatted = MobileNumberService.getInstance().formatMobileNumber(mobileNumber);
    
    if (!MobileNumberService.getInstance().validateMobileNumber(formatted)) {
      setError(t('auth.invalid_mobile'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Save mobile number to local storage
      await MobileNumberService.getInstance().saveMobileNumber(formatted);
      
      // Set authenticated state
      dispatch(setAuthenticated({
        userId: 'temp_user',
        phoneNumber: formatted
      }));

      // If existing user, complete onboarding
      if (isExistingUser) {
        dispatch(setOnboardingCompleted());
        if (onComplete) {
          onComplete();
        }
      } else {
        // New user - continue to next step (profile registration)
        onNext();
      }
    } catch (error) {
      console.error('Continue error:', error);
      setError(t('auth.something_went_wrong'));
    } finally {
      setLoading(false);
    }
  };

  if (autoDetecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <Card className="w-full max-w-sm bg-white shadow-2xl border-0 rounded-2xl overflow-hidden">
          <CardContent className="p-6 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Smartphone className="w-8 h-8 text-blue-500 animate-pulse" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {t('auth.detecting_mobile')}
              </h1>
              <p className="text-gray-600">
                {t('auth.auto_detecting_number')}
              </p>
              <div className="flex items-center justify-center space-x-2 mt-4">
                <Loader className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-sm text-gray-500">{t('common.please_wait')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-sm bg-white shadow-2xl border-0 rounded-2xl overflow-hidden">
        <CardHeader className="pb-0 px-4 pt-4">
          <div className="text-center">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto"
              style={{ backgroundColor: `${branding?.primaryColor || '#8BC34A'}20` }}
            >
              <Phone 
                className="w-8 h-8" 
                style={{ color: branding?.primaryColor || '#8BC34A' }}
              />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              {t('auth.mobile_number')}
            </h1>
            <p className="text-sm text-gray-600">
              {t('auth.enter_mobile_to_continue')}
            </p>
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4 space-y-4">
          {/* Connection Status Indicator */}
          <div className={`flex items-center justify-center space-x-2 text-xs p-2 rounded-lg ${
            isOnline 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span>{isOnline ? t('common.online') : t('common.offline')}</span>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              {t('auth.mobile_number')}
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2 z-10">
                <Phone className="w-5 h-5 text-gray-400" />
                <span className="text-lg text-gray-600 font-medium">+91</span>
              </div>
              <Input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="9898989495"
                value={mobileNumber}
                onChange={(e) => handleMobileNumberChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
                disabled={loading}
                className={`text-lg pl-20 border-2 transition-all duration-300 bg-white text-black rounded-xl h-12 ${
                  isExistingUser === true
                    ? 'focus:border-blue-400 border-blue-200'
                    : isExistingUser === false
                    ? 'focus:border-green-400 border-green-200'
                    : 'focus:border-gray-400'
                }`}
              />
              {loading && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <Loader className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {isExistingUser !== null && (
            <div className={`text-sm text-center p-3 rounded-lg border-2 ${
              isExistingUser 
                ? 'bg-blue-50 text-blue-800 border-blue-200' 
                : 'bg-green-50 text-green-800 border-green-200'
            }`}>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {isExistingUser ? t('auth.welcome_back_account_found') : t('auth.new_number_detected')}
              </div>
              {!isOnline && !isExistingUser && (
                <div className="text-xs text-orange-600 mt-1">
                  {t('auth.registration_requires_internet')}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 text-center p-3 bg-red-50 rounded-lg border border-red-200 flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <Button 
            onClick={handleContinue}
            disabled={!mobileNumber || loading || (isExistingUser === false && !isOnline)}
            className="w-full h-12 text-base font-semibold rounded-xl"
            style={{ backgroundColor: branding?.primaryColor || '#8BC34A', color: 'white' }}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <Loader className="w-4 h-4 animate-spin" />
                <span>{isExistingUser ? t('auth.signing_in') : t('auth.creating_account')}</span>
              </div>
            ) : (
              isExistingUser ? t('auth.sign_in_continue') : t('auth.continue')
            )}
          </Button>

          <Button 
            variant="outline" 
            onClick={onPrev}
            className="w-full h-10 border-2 rounded-xl"
            disabled={loading}
          >
            {t('common.back')}
          </Button>

          <div className="text-xs text-gray-500 text-center">
            {t('auth.terms_agreement')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
