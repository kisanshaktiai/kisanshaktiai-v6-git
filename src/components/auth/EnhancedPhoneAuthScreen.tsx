import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Wifi, WifiOff } from 'lucide-react';
import { enhancedAuthService } from '../../services/EnhancedAuthService';
import { connectionService } from '../../services/ConnectionService';
import { useTenant } from '../../hooks/useTenant';
import { useOffline } from '../../hooks/useOffline';

interface EnhancedPhoneAuthScreenProps {
  onSuccess: (phone: string, requiresOTP: boolean) => void;
  onError: (error: string) => void;
}

export const EnhancedPhoneAuthScreen: React.FC<EnhancedPhoneAuthScreenProps> = ({
  onSuccess,
  onError
}) => {
  const { t } = useTranslation();
  const { tenant } = useTenant();
  const { isOnline } = useOffline();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<{
    isConnected: boolean;
    latency?: number;
  }>({ isConnected: true });

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setPhone(value);
      setError(null);
    }
  };

  const formatPhoneDisplay = (phoneNumber: string) => {
    if (phoneNumber.length >= 6) {
      return phoneNumber.replace(/(\d{0,5})(\d{0,5})/, '$1 $2').trim();
    }
    return phoneNumber;
  };

  const testConnection = async () => {
    const result = await connectionService.testConnection();
    setConnectionStatus(result);
    return result.isConnected;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    if (!tenant) {
      setError('Unable to determine organization. Please refresh the page.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Test connection first
      const connected = await testConnection();
      if (!connected) {
        setError('Unable to connect to servers. Please check your internet connection.');
        setLoading(false);
        return;
      }

      const result = await enhancedAuthService.authenticateWithMobile(
        phone,
        tenant.id
      );

      if (result.success) {
        onSuccess(phone, result.requiresVerification || false);
      } else {
        setError(result.error || 'Authentication failed. Please try again.');
        onError(result.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Phone auth error:', error);
      setError('An unexpected error occurred. Please try again.');
      onError('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center space-x-2 mb-4">
            {isOnline && connectionStatus.isConnected ? (
              <Wifi className="w-5 h-5 text-green-500" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-500" />
            )}
            <span className="text-sm text-gray-600">
              {isOnline && connectionStatus.isConnected 
                ? `Connected${connectionStatus.latency ? ` (${connectionStatus.latency}ms)` : ''}` 
                : 'Connection Issues'
              }
            </span>
          </div>
          
          <CardTitle className="text-2xl font-bold text-gray-900">
            {t('auth.welcomeBack', 'Welcome Back')}
          </CardTitle>
          <p className="text-gray-600 mt-2">
            {t('auth.enterPhoneToSignIn', 'Enter your phone number to sign in')}
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.phoneNumber', 'Phone Number')}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  +91
                </span>
                <Input
                  id="phone"
                  type="tel"
                  value={formatPhoneDisplay(phone)}
                  onChange={handlePhoneChange}
                  placeholder="98765 43210"
                  className="pl-12"
                  disabled={loading || !isOnline}
                  required
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!isOnline && (
              <Alert>
                <WifiOff className="w-4 h-4" />
                <AlertDescription>
                  You're currently offline. Please check your internet connection.
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full"
              disabled={loading || !isOnline || phone.length !== 10}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('auth.connecting', 'Connecting...')}
                </>
              ) : (
                t('auth.continue', 'Continue')
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={testConnection}
                className="text-sm text-blue-600 hover:text-blue-800"
                disabled={loading}
              >
                {t('auth.testConnection', 'Test Connection')}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
