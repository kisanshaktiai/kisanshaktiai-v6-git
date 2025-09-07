import { useState, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PhoneInput } from './PhoneInput';
import { UserStatusIndicator } from './UserStatusIndicator';
import { AuthButton } from './AuthButton';
import { AuthHeader } from './AuthHeader';
import { FeaturesInfo } from './FeaturesInfo';
import { PinAuthScreen } from './PinAuthScreen';
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
  const [showPinScreen, setShowPinScreen] = useState(false);
  
  const { checkUserExists } = useAuth();
  const checkingRef = useRef<boolean>(false);
  const lastCheckedPhone = useRef<string>('');

  const handlePhoneChange = useCallback(async (value: string) => {
    setPhone(value);
    
    if (value !== lastCheckedPhone.current) {
      setUserCheckComplete(false);
      setIsNewUser(false);
      setConnectionError(null);
    }

    if (value.length === 10 && value !== lastCheckedPhone.current && !checkingRef.current) {
      checkingRef.current = true;
      setCheckingUser(true);
      
      try {
        const userExists = await checkUserExists(value);
        setIsNewUser(!userExists);
        setUserCheckComplete(true);
        lastCheckedPhone.current = value;
        
        if (userExists) {
          toast.info('Welcome back! Please enter your PIN.');
        } else {
          toast.info('New user detected. Please create an account.');
        }
      } catch (error) {
        console.error('Error checking user:', error);
        setConnectionError('Unable to verify phone number. Please check your connection.');
      } finally {
        setCheckingUser(false);
        checkingRef.current = false;
      }
    }
  }, [checkUserExists]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    setShowPinScreen(true);
  };

  const retryConnection = () => {
    setConnectionError(null);
    handlePhoneChange(phone);
  };

  if (showPinScreen) {
    return (
      <PinAuthScreen
        phoneNumber={phone}
        onBack={() => setShowPinScreen(false)}
        isNewUser={isNewUser}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardContent className="p-6">
          <AuthHeader userCheckComplete={userCheckComplete} isNewUser={isNewUser} />
          
          <form onSubmit={handleAuth} className="space-y-4">
            <PhoneInput 
              phone={phone} 
              onPhoneChange={handlePhoneChange}
              loading={checkingUser}
            />
            
            {userCheckComplete && (
              <UserStatusIndicator 
                isNewUser={isNewUser} 
                phone={phone}
                checkingUser={checkingUser}
                userCheckComplete={userCheckComplete}
              />
            )}

            {connectionError && (
              <Alert className="border-orange-200 bg-orange-50">
                <WifiOff className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  {connectionError}
                  <button
                    type="button"
                    onClick={retryConnection}
                    className="ml-2 text-orange-600 underline hover:text-orange-700"
                  >
                    Retry
                  </button>
                </AlertDescription>
              </Alert>
            )}

            <AuthButton 
              loading={loading}
              phone={phone}
              checkingUser={checkingUser}
              userCheckComplete={userCheckComplete}
              isNewUser={isNewUser}
            />
          </form>

          <FeaturesInfo />
        </CardContent>
      </Card>
    </div>
  );
};