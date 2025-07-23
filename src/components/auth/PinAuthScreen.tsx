
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDispatch } from 'react-redux';
import { setProfile } from '@/store/slices/farmerSlice';
import { setOnboardingCompleted } from '@/store/slices/authSlice';
import { setBranding } from '@/store/slices/tenantSlice';
import { mobileNumberService } from '@/services/MobileNumberService';

interface PinAuthScreenProps {
  mobileNumber: string;
  userExists: boolean;
  userData?: any;
  onNext?: (userData: any) => void;
  onPrev?: () => void;
}

export const PinAuthScreen: React.FC<PinAuthScreenProps> = ({ 
  mobileNumber, 
  userExists, 
  userData,
  onNext,
  onPrev 
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load tenant branding
    const defaultBranding = {
      tenant_id: '66372c6f-c996-4425-8749-a7561e5d6ae3',
      app_name: 'KisanShakti AI',
      app_tagline: 'Intelligent Guru for Farmers',
      logo_url: '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png',
      primary_color: '#8BC34A',
      secondary_color: '#4CAF50',
      accent_color: '#689F38',
      background_color: '#FFFFFF',
      text_color: '#1F2937',
      font_family: 'Inter'
    };
    dispatch(setBranding(defaultBranding));
  }, [dispatch]);

  const handleLogin = async () => {
    if (!pin || pin.length !== 4) {
      toast({
        title: "Invalid PIN",
        description: "Please enter a 4-digit PIN",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await mobileNumberService.loginUser(mobileNumber, pin);
      
      if (result.success) {
        // Set profile in Redux store
        if (result.profile) {
          dispatch(setProfile(result.profile));
        }
        
        // Set authentication completed
        dispatch(setOnboardingCompleted());
        
        toast({
          title: "Login successful!",
          description: `Welcome back, ${result.profile?.full_name || 'Farmer'}`,
        });
        
        // Navigate to dashboard
        navigate('/dashboard');
      } else {
        toast({
          title: "Login failed",
          description: result.error || "Invalid PIN. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: "Login failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterRedirect = () => {
    if (onNext) {
      onNext({ mobileNumber, pin });
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(value);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 mx-auto">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {userExists ? 'Enter PIN' : 'Create PIN'}
          </h1>
          <p className="text-gray-600">
            {userExists 
              ? `Welcome back! Enter your PIN for ${mobileNumber}`
              : `Create a secure 4-digit PIN for ${mobileNumber}`
            }
          </p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Input
              type={showPin ? "text" : "password"}
              placeholder="Enter 4-digit PIN"
              value={pin}
              onChange={handlePinChange}
              className="text-center text-2xl tracking-widest py-4"
              maxLength={4}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
              onClick={() => setShowPin(!showPin)}
            >
              {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          
          {userExists ? (
            <Button 
              onClick={handleLogin}
              disabled={pin.length !== 4 || loading}
              className="w-full py-3 text-lg"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </Button>
          ) : (
            <Button 
              onClick={handleRegisterRedirect}
              disabled={pin.length !== 4}
              className="w-full py-3 text-lg"
              size="lg"
            >
              Continue Registration
            </Button>
          )}
        </div>

        {userExists && (
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">
              Forgot your PIN?
            </p>
            <Button variant="link" className="text-sm">
              Contact Support
            </Button>
          </div>
        )}

        <Button 
          variant="ghost" 
          onClick={onPrev}
          className="w-full"
        >
          Back
        </Button>
      </div>
    </div>
  );
};
