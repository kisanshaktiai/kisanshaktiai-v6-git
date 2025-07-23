
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Loader, WifiOff, Wifi, Shield } from 'lucide-react';
import { useBranding } from '@/contexts/BrandingContext';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { useNetworkState } from '@/hooks/useNetworkState';
import { localStorageService } from '@/services/storage/localStorageService';
import { offlineSyncManager } from '@/services/sync/offlineSyncManager';
import { AuthHeader } from './AuthHeader';
import { AuthButton } from './AuthButton';
import { PhoneInput } from './PhoneInput';
import { FeaturesInfo } from './FeaturesInfo';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface EnhancedPhoneAuthScreenProps {
  onComplete: () => void;
}

type AuthStep = 'phone' | 'pin-login' | 'pin-create' | 'success';
type UserStatus = 'checking' | 'existing' | 'new' | null;

export const EnhancedPhoneAuthScreen: React.FC<EnhancedPhoneAuthScreenProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const { branding } = useBranding();
  const { login, register, checkExistingFarmer } = useCustomAuth();
  const { isOnline } = useNetworkState();
  
  const [step, setStep] = useState<AuthStep>('phone');
  const [mobileNumber, setMobileNumber] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [userStatus, setUserStatus] = useState<UserStatus>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(null);

  const validateMobileNumber = (mobile: string): boolean => {
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(mobile);
  };

  const checkUserExists = async (mobile: string) => {
    try {
      setUserStatus('checking');
      setError(null);
      
      // Check cache first
      const cacheKey = `user_check_${mobile}`;
      const cached = localStorageService.getCacheIfValid(cacheKey);
      if (cached) {
        setUserStatus(cached.exists ? 'existing' : 'new');
        return cached.exists;
      }
      
      if (!isOnline) {
        setError(t('auth.offline_check_user'));
        setUserStatus(null);
        return false;
      }
      
      // Check both tables simultaneously
      const [userProfileResult, farmerResult] = await Promise.all([
        supabase.from('user_profiles').select('mobile_number').eq('mobile_number', mobile).maybeSingle(),
        supabase.from('farmers').select('mobile_number').eq('mobile_number', mobile).maybeSingle()
      ]);
      
      const exists = !!(userProfileResult.data || farmerResult.data);
      
      // Cache the result
      localStorageService.setCacheWithTTL(cacheKey, { exists }, 30); // 30 minutes
      
      setUserStatus(exists ? 'existing' : 'new');
      return exists;
      
    } catch (err) {
      console.error('Error checking user:', err);
      setError(isOnline ? t('auth.error_checking_user') : t('auth.offline_check_user'));
      setUserStatus(null);
      return false;
    }
  };

  const handleAutoCheck = async (mobile: string) => {
    if (validateMobileNumber(mobile)) {
      await checkUserExists(mobile);
    } else {
      setUserStatus(null);
    }
  };

  const handleMobileSubmit = async () => {
    if (!validateMobileNumber(mobileNumber)) {
      setError(t('auth.invalid_mobile'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userExists = await checkUserExists(mobileNumber);
      
      if (userExists) {
        setStep('pin-login');
      } else {
        if (!isOnline) {
          setError(t('auth.registration_requires_internet'));
          setLoading(false);
          return;
        }
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

    // Check lockout
    if (lockoutEndTime && Date.now() < lockoutEndTime) {
      const remainingTime = Math.ceil((lockoutEndTime - Date.now()) / 1000 / 60);
      setError(t('auth.account_locked', { minutes: remainingTime }));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await login(mobileNumber, pin);
      
      if (result.success) {
        // Clear retry count on success
        setRetryCount(0);
        setLockoutEndTime(null);
        
        // Cache successful authentication
        localStorageService.setCacheWithTTL('user_auth_cache', {
          mobile: mobileNumber,
          lastLogin: Date.now()
        }, 1440); // 24 hours
        
        setStep('success');
        setTimeout(() => {
          onComplete();
        }, 2000);
      } else {
        const newRetryCount = retryCount + 1;
        setRetryCount(newRetryCount);
        
        if (newRetryCount >= 3) {
          const lockoutTime = Date.now() + (30 * 60 * 1000); // 30 minutes
          setLockoutEndTime(lockoutTime);
          setError(t('auth.account_locked', { minutes: 30 }));
        } else {
          setError(result.error || t('auth.login_failed'));
        }
        
        // Clear PIN on error for security
        setPin('');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(t('auth.login_failed'));
      setPin('');
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

    if (!isOnline) {
      // Offline registration
      try {
        const tempId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const registrationData = {
          tempId,
          mobile: mobileNumber,
          pin,
          createdAt: new Date().toISOString(),
          syncStatus: 'pending'
        };
        
        // Store in localStorage
        localStorageService.setSecure('offline_registration', registrationData);
        
        // Queue for sync
        await offlineSyncManager.queueOperation({
          type: 'insert',
          table: 'user_profiles',
          data: {
            mobile_number: mobileNumber,
            created_at: new Date().toISOString()
          },
          priority: 'high'
        });
        
        await offlineSyncManager.queueOperation({
          type: 'insert',
          table: 'farmers',
          data: {
            mobile_number: mobileNumber,
            pin,
            profile_completion_percentage: 0,
            created_at: new Date().toISOString()
          },
          priority: 'high'
        });
        
        // Set features as locked
        localStorageService.setCacheWithTTL('feature_access_status', {
          weather: true,
          aiChat: false,
          myLand: false,
          cropAdvisor: false,
          organicInputs: false,
          community: false
        }, 1440);
        
        setStep('success');
        setTimeout(() => {
          onComplete();
        }, 2000);
        
      } catch (err) {
        console.error('Offline registration error:', err);
        setError(t('auth.registration_failed'));
      }
      return;
    }

    // Online registration
    setLoading(true);
    setError(null);

    try {
      const result = await register(mobileNumber, pin);
      
      if (result.success) {
        // Set initial feature access
        localStorageService.setCacheWithTTL('feature_access_status', {
          weather: true,
          aiChat: false,
          myLand: false,
          cropAdvisor: false,
          organicInputs: false,
          community: false
        }, 1440);
        
        setStep('success');
        setTimeout(() => {
          onComplete();
        }, 2000);
      } else {
        setError(result.error || t('auth.registration_failed'));
        // Clear PINs on error
        setPin('');
        setConfirmPin('');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(t('auth.registration_failed'));
      setPin('');
      setConfirmPin('');
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
    setRetryCount(0);
    setLockoutEndTime(null);
  };

  const getCurrentStep = () => {
    if (step === 'pin-login') return 'login';
    if (step === 'pin-create') return 'signup';
    return 'phone';
  };

  const renderPhoneStep = () => (
    <div className="space-y-4">
      {/* Connection Status Indicator */}
      <div className={`flex items-center justify-center space-x-2 text-xs p-2 rounded-lg ${
        isOnline 
          ? 'bg-green-50 text-green-800 border border-green-200' 
          : 'bg-red-50 text-red-800 border border-red-200'
      }`}>
        {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
        <span>{isOnline ? t('common.online') : t('common.offline')}</span>
      </div>

      <PhoneInput
        phone={mobileNumber}
        onPhoneChange={setMobileNumber}
        loading={loading}
        checkingUser={userStatus === 'checking'}
        userCheckComplete={userStatus !== null && userStatus !== 'checking'}
        isNewUser={userStatus === 'new'}
        onAutoCheck={handleAutoCheck}
      />

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
                <CheckCircle className="w-4 h-4" />
                {t('auth.new_number_detected')}
                {!isOnline && (
                  <div className="text-xs text-orange-600 mt-1">
                    {t('auth.registration_requires_internet')}
                  </div>
                )}
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

      <AuthButton
        loading={loading}
        phone={mobileNumber}
        checkingUser={userStatus === 'checking'}
        userCheckComplete={userStatus !== null && userStatus !== 'checking'}
        isNewUser={userStatus === 'new'}
        onContinue={handleMobileSubmit}
      />
    </div>
  );

  const renderPinLoginStep = () => (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Shield className="w-5 h-5 text-primary" />
          <p className="text-gray-600">
            {t('auth.enter_pin_for')} <span className="font-semibold">+91 {mobileNumber}</span>
          </p>
        </div>
        {!isOnline && (
          <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded border">
            {t('auth.offline_login_mode')}
          </div>
        )}
        {retryCount > 0 && !lockoutEndTime && (
          <div className="text-xs text-red-600">
            {t('auth.retry_attempt', { count: retryCount, max: 3 })}
          </div>
        )}
        {lockoutEndTime && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded border">
            {t('auth.account_locked_message')}
          </div>
        )}
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
            autoFocus
            disabled={loading || (lockoutEndTime && Date.now() < lockoutEndTime)}
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
            disabled={pin.length !== 4 || loading || (lockoutEndTime && Date.now() < lockoutEndTime)}
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
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Shield className="w-5 h-5 text-primary" />
          <p className="text-gray-600">
            {t('auth.create_secure_pin')}
          </p>
        </div>
        {!isOnline && (
          <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded border">
            {t('auth.offline_registration_mode')}
          </div>
        )}
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
            autoFocus
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

        {pin && confirmPin && pin !== confirmPin && (
          <div className="text-xs text-orange-600 text-center">
            {t('auth.pins_dont_match')}
          </div>
        )}

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
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {userStatus === 'new' ? t('auth.account_created') : t('auth.welcome_back')}
          </h2>
          <p className="text-gray-600">
            {t('auth.redirecting_to_app')}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-1">
      <Card className="w-full max-w-sm bg-white shadow-2xl border-0 rounded-2xl overflow-hidden">
        <CardHeader className="pb-0 px-3 pt-3">
          <AuthHeader 
            userCheckComplete={userStatus !== null && userStatus !== 'checking'}
            isNewUser={userStatus === 'new'}
            currentStep={getCurrentStep()}
          />
        </CardHeader>
        
        <CardContent className="px-3 pb-3">
          {step === 'phone' && renderPhoneStep()}
          {step === 'pin-login' && renderPinLoginStep()}
          {step === 'pin-create' && renderPinCreateStep()}
          {step === 'success' && renderSuccessStep()}
          
          {step === 'phone' && <FeaturesInfo />}
        </CardContent>
      </Card>
    </div>
  );
};
