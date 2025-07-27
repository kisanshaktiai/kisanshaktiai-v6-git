
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Phone, Lock, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { signInWithPhone, checkUserExists } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';

interface AuthScreenProps {
  onSuccess: () => void;
  onBack: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess, onBack }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'phone' | 'verification'>('phone');

  // For demo purposes, auto-fill with test number
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setPhone('8485019495'); // Test number
    }
  }, []);

  const validatePhone = (phoneNumber: string): boolean => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePhone(phone)) {
      setError(t('auth.invalidPhone'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('Starting phone authentication for:', phone.replace(/\d/g, '*'));
      
      // Check if user exists first
      const userExists = await checkUserExists(phone);
      console.log('User exists:', userExists);

      // Proceed with authentication
      const result = await signInWithPhone(phone);
      
      console.log('Authentication result:', {
        success: result.success,
        isNewUser: result.isNewUser,
        userId: result.userId
      });

      if (result.success) {
        toast({
          title: userExists ? t('auth.loginSuccess') : t('auth.registrationSuccess'),
          description: userExists ? t('auth.welcomeBack') : t('auth.welcomeNew'),
        });
        
        // Short delay to show toast
        setTimeout(() => {
          onSuccess();
        }, 500);
      } else {
        throw new Error(result.error || 'Authentication failed');
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      
      let errorMessage = t('auth.loginFailed');
      
      if (error.message?.includes('network') || error.message?.includes('connection')) {
        errorMessage = t('auth.networkError');
      } else if (error.message?.includes('timeout')) {
        errorMessage = t('auth.timeoutError');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: t('auth.error'),
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setPhone(value);
      setError('');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            {t('auth.welcome')}
          </CardTitle>
          <CardDescription>
            {t('auth.phoneSubtitle')}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                {t('auth.phoneNumber')}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="8485019495"
                  value={phone}
                  onChange={handlePhoneChange}
                  className="pl-10"
                  maxLength={10}
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t('auth.phoneHint')}
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={!validatePhone(phone) || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('auth.processing')}
                </>
              ) : (
                <>
                  {t('auth.continue')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="text-center">
            <Button variant="ghost" onClick={onBack} disabled={isLoading}>
              {t('common.back')}
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground text-center">
                Dev Mode: Test number 8485019495 is pre-filled
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
