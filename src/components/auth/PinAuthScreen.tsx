import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setAuthenticated } from '@/store/slices/authSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Lock, Shield, Smartphone } from 'lucide-react';
import { tenantAuthService } from '@/services/TenantAuthService';

interface PinAuthScreenProps {
  phoneNumber: string;
  onBack: () => void;
  isNewUser?: boolean;
}

export const PinAuthScreen: React.FC<PinAuthScreenProps> = ({ phoneNumber, onBack, isNewUser = false }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate PIN
    if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      toast.error('PIN must be exactly 6 digits');
      return;
    }

    // For new users, validate confirm PIN and name
    if (isNewUser) {
      if (pin !== confirmPin) {
        toast.error('PINs do not match');
        return;
      }
      if (!fullName.trim()) {
        toast.error('Please enter your name');
        return;
      }
    }

    setIsLoading(true);

    try {
      let result;
      
      if (isNewUser) {
        // Register new farmer
        result = await tenantAuthService.registerFarmer({
          mobileNumber: phoneNumber,
          pin: pin,
          fullName: fullName.trim(),
          preferredLanguage: 'hi'
        });
      } else {
        // Authenticate existing farmer
        result = await tenantAuthService.authenticateFarmer(phoneNumber, pin);
      }

      if (result.success) {
        dispatch(setAuthenticated({ 
          userId: result.userId, 
          phoneNumber 
        }));
        
        toast.success(isNewUser ? 
          '🌱 Welcome to KisanShakti AI! Registration successful!' : 
          '🌱 Welcome back! Login successful.'
        );
        
        navigate('/mobile');
      } else {
        toast.error(result.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {isNewUser ? 'Create Your PIN' : 'Enter Your PIN'}
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            <Smartphone className="inline w-4 h-4 mr-1" />
            {phoneNumber}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isNewUser && (
              <div>
                <Label htmlFor="fullName">Your Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading}
                  className="mt-1"
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="pin">
                {isNewUser ? 'Create 6-digit PIN' : '6-digit PIN'}
              </Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="••••••"
                value={pin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 6) setPin(value);
                }}
                disabled={isLoading}
                className="mt-1 text-center text-2xl tracking-widest"
              />
            </div>

            {isNewUser && (
              <div>
                <Label htmlFor="confirmPin">Confirm PIN</Label>
                <Input
                  id="confirmPin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="••••••"
                  value={confirmPin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 6) setConfirmPin(value);
                  }}
                  disabled={isLoading}
                  className="mt-1 text-center text-2xl tracking-widest"
                />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button 
                type="button"
                onClick={onBack} 
                variant="outline" 
                disabled={isLoading}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                type="submit"
                disabled={isLoading || !pin || (isNewUser && (!confirmPin || !fullName))}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    {isNewUser ? 'Create Account' : 'Sign In'}
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground mt-4">
              Your PIN is encrypted and stored securely. Never share it with anyone.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
