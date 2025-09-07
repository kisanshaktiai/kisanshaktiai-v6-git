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
import { simpleFarmerAuth } from '@/services/SimpleFarmerAuthService';
import { tenantTheme } from '@/services/TenantThemeService';
import { useUnifiedTenantData } from '@/hooks';

interface PinAuthScreenProps {
  phoneNumber: string;
  onBack: () => void;
  isNewUser?: boolean;
}

export const PinAuthScreen: React.FC<PinAuthScreenProps> = ({ phoneNumber, onBack, isNewUser = false }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { branding } = useUnifiedTenantData();
  
  // Get tenant-specific branding
  const themeBranding = tenantTheme.getBranding();
  const appName = branding?.app_name || themeBranding.appName;

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate PIN (4 digits as per database)
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      toast.error('PIN must be exactly 4 digits');
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
        result = await simpleFarmerAuth.register(phoneNumber, pin, {
          full_name: fullName.trim(),
          tenant_id: 'emergency-tenant',
          preferred_language: 'hi'
        });
      } else {
        // Authenticate existing farmer
        result = await simpleFarmerAuth.login(phoneNumber, pin);
      }

      if (result.success) {
        // Store session in localStorage (handled by SimpleFarmerAuthService)
        
        dispatch(setAuthenticated({ 
          userId: result.farmer?.id || result.session?.farmer_id, 
          phoneNumber 
        }));
        
        toast.success(isNewUser ? 
          `🌱 Welcome to ${appName}! Registration successful!` : 
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-primary" />
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
                {isNewUser ? 'Create 4-digit PIN' : '4-digit PIN'}
              </Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                placeholder="••••"
                value={pin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 4) setPin(value);
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
                  maxLength={4}
                  placeholder="••••"
                  value={confirmPin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 4) setConfirmPin(value);
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
                className="flex-1 bg-primary hover:bg-primary/90"
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
