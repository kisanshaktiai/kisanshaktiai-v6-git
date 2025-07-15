import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { setAuthenticated } from '@/store/slices/authSlice';
import { DeviceService } from '@/services/DeviceService';
import { Phone } from 'lucide-react';

interface AuthScreenProps {
  onNext: () => void;
  onPrev: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

// This component is now deprecated in favor of MobileNumberScreen
// Keeping for backward compatibility but redirecting to new flow
export const AuthScreen: React.FC<AuthScreenProps> = ({ onNext, onPrev }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!phoneNumber || phoneNumber.length < 10) return;

    setLoading(true);
    try {
      // Get device ID for secure authentication
      const deviceId = await DeviceService.getInstance().getDeviceId();
      
      // Simple phone-based auth without OTP for demo
      const token = `token_${deviceId}_${Date.now()}`;
      
      dispatch(setAuthenticated({
        phoneNumber,
        deviceId,
        token,
      }));

      onNext();
    } catch (error) {
      console.error('Authentication error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 mx-auto">
            <Phone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('auth.phone_number')}
          </h1>
          <p className="text-gray-600">
            {t('auth.enter_phone')}
          </p>
        </div>

        <div className="space-y-4">
          <Input
            type="tel"
            placeholder="+91 9876543210"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="text-center text-lg py-3"
          />
          
          <Button 
            onClick={handleAuth}
            disabled={!phoneNumber || phoneNumber.length < 10 || loading}
            className="w-full py-3 text-lg"
            size="lg"
          >
            {loading ? t('common.loading') : t('auth.login')}
          </Button>
        </div>

        <Button 
          variant="ghost" 
          onClick={onPrev}
          className="w-full"
        >
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  );
};
