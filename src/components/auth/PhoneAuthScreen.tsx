import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PhoneInput } from './PhoneInput';
import { UserStatusIndicator } from './UserStatusIndicator';
import { AuthButton } from './AuthButton';
import { AuthHeader } from './AuthHeader';
import { FeaturesInfo } from './FeaturesInfo';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { UserPlus, LogIn } from 'lucide-react';

interface PhoneAuthScreenProps {
  onComplete: () => void;
}

export const PhoneAuthScreen = ({ onComplete }: PhoneAuthScreenProps) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [checkingUser, setCheckingUser] = useState(false);
  const [userCheckComplete, setUserCheckComplete] = useState(false);

  const { checkUserExists, signInWithPhone } = useAuth();

  const handlePhoneChange = async (value: string) => {
    setPhone(value);
    setUserCheckComplete(false);
    setIsNewUser(false);

    if (value.length === 10) {
      setCheckingUser(true);
      try {
        console.log('=== PHONE INPUT USER CHECK ===');
        console.log('Checking if user exists for phone:', value);
        
        const userExists = await checkUserExists(value);
        setIsNewUser(!userExists);
        setUserCheckComplete(true);
        
        console.log('Phone input user check result:', {
          phone: value,
          exists: userExists,
          isNewUser: !userExists
        });

        // Show feedback toast
        if (userExists) {
          toast.success('Welcome back! Account found', {
            duration: 2000,
            icon: <LogIn className="w-4 h-4" />
          });
        } else {
          toast.info('New number detected', {
            duration: 2000,
            icon: <UserPlus className="w-4 h-4" />
          });
        }
      } catch (error) {
        console.error('Error checking user existence:', error);
        setIsNewUser(true);
        setUserCheckComplete(true);
        toast.error('New number detected', {
          duration: 3000
        });
      } finally {
        setCheckingUser(false);
      }
    } else {
      setIsNewUser(false);
      setUserCheckComplete(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    if (!userCheckComplete) {
      toast.error('Please wait for user verification to complete');
      return;
    }

    setLoading(true);
    try {
      console.log('Starting authentication for phone:', phone);
      await signInWithPhone(phone);
      
      if (isNewUser) {
        toast.success('🎉 Account created successfully!', {
          duration: 4000
        });
      } else {
        toast.success('🌱 Welcome back! Login successful.', {
          duration: 4000
        });
      }
      
      onComplete();
    } catch (error: any) {
      console.error('Authentication error:', error);
      if (isNewUser) {
        if (error?.message?.includes('already exists') || error?.message?.includes('duplicate')) {
          toast.error('Account already exists', {
            duration: 5000
          });
        } else {
          toast.error(error?.message || 'Account creation failed', {
            duration: 5000
          });
        }
      } else {
        if (error?.message?.includes('User not found') || error?.message?.includes('Invalid')) {
          toast.error('Account not found', {
            duration: 5000
          });
        } else {
          toast.error(error?.message || 'Login failed', {
            duration: 5000
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-card">
        <AuthHeader userCheckComplete={userCheckComplete} isNewUser={isNewUser} />
        
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-6">
            <PhoneInput
              phone={phone}
              onPhoneChange={handlePhoneChange}
              loading={loading}
              checkingUser={checkingUser}
              userCheckComplete={userCheckComplete}
              isNewUser={isNewUser}
            />
            
            <UserStatusIndicator
              phone={phone}
              checkingUser={checkingUser}
              userCheckComplete={userCheckComplete}
              isNewUser={isNewUser}
            />
            
            <AuthButton
              loading={loading}
              phone={phone}
              checkingUser={checkingUser}
              userCheckComplete={userCheckComplete}
              isNewUser={isNewUser}
            />
          </form>
          
          <FeaturesInfo />
          
          <p className="text-xs text-muted-foreground text-center mt-4">
            Secure authentication powered by Supabase. No OTP required for demo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};