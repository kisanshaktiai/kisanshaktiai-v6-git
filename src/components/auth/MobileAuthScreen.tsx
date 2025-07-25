
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EnhancedPhoneAuthScreen } from './EnhancedPhoneAuthScreen';
import { PinAuthScreen } from './PinAuthScreen';
import { LoadingScreen } from '../common/LoadingScreen';
import { useAuth } from '../../hooks/useAuth';
import { useTenant } from '../../hooks/useTenant';
import { authHealthService } from '../../services/authHealthService';

export const MobileAuthScreen: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currentTenant, loading: tenantLoading } = useTenant();
  const [currentStep, setCurrentStep] = useState<'phone' | 'otp' | 'loading'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performHealthCheck = async () => {
      try {
        const healthCheck = await authHealthService.performHealthCheck();
        console.log('Auth health check completed:', healthCheck);
        
        if (healthCheck.status === 'error') {
          console.warn('Authentication service health issues detected:', healthCheck.errors);
        }
      } catch (error) {
        console.error('Health check failed:', error);
      }
    };

    performHealthCheck();
  }, []);

  // If user is already authenticated, don't show auth screen
  if (user) {
    return null;
  }

  // Show loading while tenant is being detected
  if (tenantLoading) {
    return <LoadingScreen message={t('auth.loadingTenant', 'Detecting organization...')} />;
  }

  // If no tenant found, show error
  if (!currentTenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-800 mb-4">
            {t('auth.noTenantFound', 'Organization Not Found')}
          </h2>
          <p className="text-red-600 mb-6">
            {t('auth.noTenantDescription', 'Unable to determine your organization. Please contact support.')}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
          >
            {t('auth.retry', 'Try Again')}
          </button>
        </div>
      </div>
    );
  }

  const handlePhoneSuccess = (phone: string, requiresOTP: boolean) => {
    setPhoneNumber(phone);
    setError(null);
    
    if (requiresOTP) {
      setCurrentStep('otp');
    } else {
      // Direct login without OTP
      setCurrentStep('loading');
    }
  };

  const handlePhoneError = (errorMessage: string) => {
    setError(errorMessage);
    setCurrentStep('phone');
  };

  const handleOTPSuccess = () => {
    setCurrentStep('loading');
    // The auth state will be handled by the useAuth hook
  };

  const handleOTPError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleBackToPhone = () => {
    setCurrentStep('phone');
    setPhoneNumber('');
    setError(null);
  };

  if (currentStep === 'loading') {
    return <LoadingScreen message={t('auth.completingLogin', 'Completing login...')} />;
  }

  if (currentStep === 'otp') {
    return (
      <PinAuthScreen
        phoneNumber={phoneNumber}
        onSuccess={handleOTPSuccess}
        onError={handleOTPError}
        onBack={handleBackToPhone}
      />
    );
  }

  return (
    <EnhancedPhoneAuthScreen
      onSuccess={handlePhoneSuccess}
      onError={handlePhoneError}
    />
  );
};
