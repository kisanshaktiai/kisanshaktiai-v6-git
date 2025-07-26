
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PhoneInput } from './PhoneInput';
import { UserStatusIndicator } from './UserStatusIndicator';
import { AuthButton } from './AuthButton';
import { AuthHeader } from './AuthHeader';
import { FeaturesInfo } from './FeaturesInfo';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { UserPlus, LogIn, Wifi, WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PhoneAuthScreenProps {
  onComplete: () => void;
}

export const PhoneAuthScreen = ({ onComplete }: PhoneAuthScreenProps) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [checkingUser, setCheckingUser] = useState(false);
  const [userCheckComplete, setUserCheckComplete] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const { checkUserExists, signInWithPhone } = useAuth();

  const handlePhoneChange = async (value: string) => {
    setPhone(value);
    setUserCheckComplete(false);
    setIsNewUser(false);
    setConnectionError(null);

    if (value.length === 10) {
      setCheckingUser(true);
      try {
        console.log('=== PHONE INPUT USER CHECK ===');
        console.log('Checking if user exists for phone:', value.replace(/\d/g, '*'));
        
        const userExists = await checkUserExists(value);
        setIsNewUser(!userExists);
        setUserCheckComplete(true);
        
        console.log('Phone input user check result:', {
          phone: value.replace(/\d/g, '*'),
          exists: userExists,
          isNewUser: !userExists
        });

        // Show feedback toast
        if (userExists) {
          toast.success('Welcome back! Ready to continue', {
            duration: 2000,
            icon: <LogIn className="w-4 h-4" />
          });
        } else {
          toast.info('Ready to get started with KisanShakti AI!', {
            duration: 2000,
            icon: <UserPlus className="w-4 h-4" />
          });
        }
      } catch (error) {
        console.error('Error checking user existence:', error);
        const errorMessage = error instanceof Error ? error.message : 'Connection failed';
        
        if (errorMessage.includes('connect') || errorMessage.includes('network') || errorMessage.includes('fetch')) {
          setConnectionError('Unable to connect to KisanShakti AI servers. Please check your internet connection.');
        } else {
          setConnectionError('Service temporarily unavailable. Please try again in a moment.');
        }
        
        setIsNewUser(true);
        setUserCheckComplete(false);
        
        toast.error('Connection issue detected', {
          duration: 3000,
          icon: <WifiOff className="w-4 h-4" />
        });
      } finally {
        setCheckingUser(false);
      }
    } else {
      setIsNewUser(false);
      setUserCheckComplete(false);
      setConnectionError(null);
    }
  };

  const retryConnection = async () => {
    if (phone.length === 10) {
      setRetryCount(prev => prev + 1);
      await handlePhoneChange(phone);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone || phone.length < 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    // Allow auth even if user check failed (connection issues)
    if (connectionError && !userCheckComplete) {
      console.log('Proceeding with auth despite connection issues...');
    }

    setLoading(true);
    setConnectionError(null);
    
    try {
      console.log('Starting KisanShakti AI authentication for phone:', phone.replace(/\d/g, '*'));
      await signInWithPhone(phone);
      
      // Success message based on whether we know if user is new
      if (userCheckComplete) {
        if (isNewUser) {
          toast.success('🌱 Welcome to KisanShakti AI! Account created successfully!', {
            duration: 4000
          });
        } else {
          toast.success('🌱 Welcome back to KisanShakti AI! Login successful.', {
            duration: 4000
          });
        }
      } else {
        toast.success('🌱 Welcome to KisanShakti AI! Authentication successful.', {
          duration: 4000
        });
      }
      
      onComplete();
    } catch (error: any) {
      console.error('Authentication error:', error);
      const errorMessage = error?.message || 'Authentication failed';
      
      if (errorMessage.includes('connect') || errorMessage.includes('network') || errorMessage.includes('servers')) {
        setConnectionError('Unable to connect to KisanShakti AI servers. Please check your internet connection and try again.');
        toast.error('Connection failed - Please check your internet connection', {
          duration: 5000,
          icon: <WifiOff className="w-4 h-4" />
        });
      } else if (errorMessage.includes('timeout')) {
        setConnectionError('Request timed out. Please try again.');
        toast.error('Connection timeout - Please try again', {
          duration: 5000
        });
      } else if (errorMessage.includes('maintenance')) {
        setConnectionError('KisanShakti AI is currently under maintenance. Please try again in a few minutes.');
        toast.error('Service temporarily unavailable', {
          duration: 5000
        });
      } else {
        // Generic error handling
        if (userCheckComplete && isNewUser) {
          if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
            toast.error('Account already exists on KisanShakti AI', {
              duration: 5000
            });
          } else {
            toast.error('Account creation failed - ' + errorMessage, {
              duration: 5000
            });
          }
        } else if (userCheckComplete && !isNewUser) {
          if (errorMessage.includes('User not found') || errorMessage.includes('Invalid')) {
            toast.error('Account not found on KisanShakti AI', {
              duration: 5000
            });
          } else {
            toast.error('Login failed - ' + errorMessage, {
              duration: 5000
            });
          }
        } else {
          toast.error('Authentication failed - ' + errorMessage, {
            duration: 5000
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-sm mx-auto px-4">
        <Card className="border-0 shadow-none bg-transparent">
          <AuthHeader userCheckComplete={userCheckComplete} isNewUser={isNewUser} />
          
          <CardContent className="px-0">
            <form onSubmit={handleAuth} className="space-y-4">
              <PhoneInput
                phone={phone}
                onPhoneChange={handlePhoneChange}
                loading={loading}
                checkingUser={checkingUser}
                userCheckComplete={userCheckComplete}
                isNewUser={isNewUser}
              />
              
              {connectionError && (
                <Alert variant="destructive">
                  <WifiOff className="w-4 h-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>{connectionError}</span>
                    {phone.length === 10 && (
                      <button
                        type="button"
                        onClick={retryConnection}
                        className="ml-2 text-sm underline hover:no-underline"
                        disabled={checkingUser}
                      >
                        {checkingUser ? 'Retrying...' : 'Retry'}
                      </button>
                    )}
                  </AlertDescription>
                </Alert>
              )}
              
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
                userCheckComplete={userCheckComplete || Boolean(connectionError)}
                isNewUser={isNewUser}
              />
            </form>
            
            <FeaturesInfo />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
