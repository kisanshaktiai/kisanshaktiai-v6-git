
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Phone, Loader, CheckCircle2, ArrowRight, Shield, Lock } from 'lucide-react';
import { RootState } from '@/store';
import { useCustomAuth } from '@/hooks/useCustomAuth';

interface CustomMobileAuthScreenProps {
  onComplete: () => void;
}

type AuthStep = 'mobile' | 'pin' | 'verification';

export const CustomMobileAuthScreen: React.FC<CustomMobileAuthScreenProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const { tenantBranding } = useSelector((state: RootState) => state.tenant);
  const { login, register, checkExistingFarmer } = useCustomAuth();
  
  const [step, setStep] = useState<AuthStep>('mobile');
  const [mobileNumber, setMobileNumber] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExistingFarmer, setIsExistingFarmer] = useState<boolean | null>(null);

  const primaryColor = tenantBranding?.primary_color || '#10B981';
  const appName = tenantBranding?.app_name || 'KisanShakti AI';

  const handleMobileNumberChange = async (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      setMobileNumber(cleaned);
      setError(null);
      setIsExistingFarmer(null);

      if (cleaned.length === 10) {
        const exists = await checkExistingFarmer(cleaned);
        setIsExistingFarmer(exists);
      }
    }
  };

  const handleMobileSubmit = () => {
    if (mobileNumber.length !== 10) {
      setError(t('auth.invalid_mobile'));
      return;
    }
    setStep('pin');
  };

  const handlePinSubmit = async () => {
    if (pin.length < 4) {
      setError(t('auth.invalid_pin'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let response;
      
      if (isExistingFarmer) {
        // Login existing farmer
        response = await login(mobileNumber, pin);
      } else {
        // Register new farmer
        response = await register(mobileNumber, pin);
      }

      if (response.success) {
        setStep('verification');
        setTimeout(() => {
          onComplete();
        }, 2000);
      } else {
        setError(response.error || (isExistingFarmer ? t('auth.login_failed') : t('auth.registration_failed')));
      }
    } catch (error) {
      setError(t('auth.unexpected_error'));
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
            {isExistingFarmer !== null && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  isExistingFarmer ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  <CheckCircle2 className={`w-4 h-4 ${
                    isExistingFarmer ? 'text-green-600' : 'text-blue-600'
                  }`} />
                </div>
              </div>
            )}
          </div>
        </div>

        {isExistingFarmer !== null && (
          <div className={`text-sm text-center p-3 rounded-lg border ${
            isExistingFarmer 
              ? 'bg-green-50 text-green-800 border-green-200' 
              : 'bg-blue-50 text-blue-800 border-blue-200'
          }`}>
            {isExistingFarmer ? t('auth.welcome_back') : t('auth.new_farmer_signup')}
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 text-center p-3 bg-red-50 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <Button 
          onClick={handleMobileSubmit}
          disabled={mobileNumber.length !== 10}
          className="w-full h-14 text-lg font-semibold rounded-xl"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="flex items-center space-x-2">
            <span>{t('auth.continue')}</span>
            <ArrowRight className="w-5 h-5" />
          </div>
        </Button>
      </div>
    </div>
  );

  const renderPinStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div 
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg"
          style={{ backgroundColor: `${primaryColor}15`, border: `2px solid ${primaryColor}` }}
        >
          <Lock className="w-10 h-10" style={{ color: primaryColor }} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isExistingFarmer ? t('auth.enter_pin') : t('auth.create_pin')}
        </h1>
        <p className="text-gray-600 text-base px-4">
          {isExistingFarmer 
            ? t('auth.enter_pin_to_login')
            : t('auth.create_secure_pin')
          }
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 block text-center">
            {isExistingFarmer ? t('auth.your_pin') : t('auth.new_pin')}
          </label>
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={pin}
              onChange={setPin}
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
          <p className="text-xs text-gray-500 text-center">
            {t('auth.pin_length_hint')}
          </p>
        </div>

        {error && (
          <div className="text-sm text-red-600 text-center p-3 bg-red-50 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <Button 
          onClick={handlePinSubmit}
          disabled={pin.length < 4 || loading}
          className="w-full h-14 text-lg font-semibold rounded-xl"
          style={{ backgroundColor: primaryColor }}
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <Loader className="w-5 h-5 animate-spin" />
              <span>{isExistingFarmer ? t('auth.logging_in') : t('auth.creating_account')}</span>
            </div>
          ) : (
            isExistingFarmer ? t('auth.login') : t('auth.create_account')
          )}
        </Button>

        <Button
          variant="ghost"
          onClick={() => setStep('mobile')}
          className="w-full text-sm"
        >
          {t('auth.back_to_mobile')}
        </Button>
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
          {isExistingFarmer ? t('auth.login_success') : t('auth.account_created')}
        </h1>
        <p className="text-gray-600 text-base">
          {isExistingFarmer ? t('auth.welcome_back_message') : t('auth.account_setup_complete')}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        {step === 'mobile' && renderMobileStep()}
        {step === 'pin' && renderPinStep()}
        {step === 'verification' && renderVerificationStep()}
      </div>
    </div>
  );
};
