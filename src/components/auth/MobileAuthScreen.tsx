
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { setAuthenticated } from '@/store/slices/authSlice';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { Phone, Loader, CheckCircle2, ArrowRight, Shield, Globe } from 'lucide-react';
import { RootState } from '@/store';

interface MobileAuthScreenProps {
  onComplete: () => void;
}

type AuthStep = 'mobile' | 'otp' | 'verification';

export const MobileAuthScreen: React.FC<MobileAuthScreenProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { tenantBranding } = useSelector((state: RootState) => state.tenant);
  const { login, register, checkExistingFarmer } = useCustomAuth();
  
  const [step, setStep] = useState<AuthStep>('mobile');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExistingUser, setIsExistingUser] = useState<boolean | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  const primaryColor = tenantBranding?.primary_color || '#10B981';
  const appName = tenantBranding?.app_name || 'KisanShakti AI';

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(timer => timer - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleMobileNumberChange = async (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      setMobileNumber(cleaned);
      setError(null);
      setIsExistingUser(null);

      if (cleaned.length === 10) {
        const isRegistered = await checkExistingFarmer(cleaned);
        setIsExistingUser(isRegistered);
      }
    }
  };

  const handleSendOTP = async () => {
    if (mobileNumber.length !== 10) {
      setError(t('auth.invalid_mobile'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Simulate OTP sending - redirect to PIN auth instead
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Complete authentication flow
      onComplete();
    } catch (error) {
      setError(t('auth.otp_send_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError(t('auth.invalid_otp'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Simulate OTP verification
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setStep('verification');
      
      dispatch(setAuthenticated({
        userId: 'demo_user',
        phoneNumber: `+91${mobileNumber}`
      }));

      // Success animation delay
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (error) {
      setError(t('auth.verification_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setResendTimer(30);
      setError(null);
    } catch (error) {
      setError(t('auth.resend_failed'));
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
          {t('auth.mobile_subtitle')}
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
            {isExistingUser !== null && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  isExistingUser ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  <CheckCircle2 className={`w-4 h-4 ${
                    isExistingUser ? 'text-green-600' : 'text-blue-600'
                  }`} />
                </div>
              </div>
            )}
          </div>
        </div>

        {isExistingUser !== null && (
          <div className={`text-sm text-center p-3 rounded-lg border ${
            isExistingUser 
              ? 'bg-green-50 text-green-800 border-green-200' 
              : 'bg-blue-50 text-blue-800 border-blue-200'
          }`}>
            {isExistingUser ? t('auth.welcome_back') : t('auth.new_user_signup')}
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 text-center p-3 bg-red-50 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <Button 
          onClick={handleSendOTP}
          disabled={mobileNumber.length !== 10 || loading}
          className="w-full h-14 text-lg font-semibold rounded-xl"
          style={{ backgroundColor: primaryColor }}
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <Loader className="w-5 h-5 animate-spin" />
              <span>{t('auth.sending_otp')}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span>{isExistingUser ? t('auth.login') : t('auth.get_started')}</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          )}
        </Button>
      </div>

      <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 px-4">
        <Shield className="w-4 h-4" />
        <span>{t('auth.privacy_notice')}</span>
      </div>
    </div>
  );

  const renderOTPStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div 
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg"
          style={{ backgroundColor: `${primaryColor}15`, border: `2px solid ${primaryColor}` }}
        >
          <Shield className="w-10 h-10" style={{ color: primaryColor }} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t('auth.verify_otp')}
        </h1>
        <p className="text-gray-600 text-base px-4">
          {t('auth.otp_sent_to')} <span className="font-semibold">+91 {mobileNumber}</span>
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 block text-center">
            {t('auth.enter_otp')}
          </label>
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={setOtp}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="w-12 h-14 text-lg font-bold" />
                <InputOTPSlot index={1} className="w-12 h-14 text-lg font-bold" />
                <InputOTPSlot index={2} className="w-12 h-14 text-lg font-bold" />
                <InputOTPSlot index={3} className="w-12 h-14 text-lg font-bold" />
                <InputOTPSlot index={4} className="w-12 h-14 text-lg font-bold" />
                <InputOTPSlot index={5} className="w-12 h-14 text-lg font-bold" />
              </InputOTPGroup>
            </InputOTP>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 text-center p-3 bg-red-50 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <Button 
          onClick={handleVerifyOTP}
          disabled={otp.length !== 6 || loading}
          className="w-full h-14 text-lg font-semibold rounded-xl"
          style={{ backgroundColor: primaryColor }}
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <Loader className="w-5 h-5 animate-spin" />
              <span>{t('auth.verifying')}</span>
            </div>
          ) : (
            t('auth.verify_continue')
          )}
        </Button>

        <div className="text-center">
          <Button
            variant="ghost"
            onClick={handleResendOTP}
            disabled={resendTimer > 0 || loading}
            className="text-sm"
          >
            {resendTimer > 0 
              ? `${t('auth.resend_in')} ${resendTimer}s`
              : t('auth.resend_otp')
            }
          </Button>
        </div>
      </div>
    </div>
  );

  const renderVerificationStep = () => (
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
          {t('auth.verification_success')}
        </h1>
        <p className="text-gray-600 text-base">
          {isExistingUser ? t('auth.welcome_back_message') : t('auth.account_created_message')}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        {step === 'mobile' && renderMobileStep()}
        {step === 'otp' && renderOTPStep()}
        {step === 'verification' && renderVerificationStep()}
      </div>
    </div>
  );
};
