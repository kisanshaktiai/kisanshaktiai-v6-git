
import { Button } from '@/components/ui/button';
import { Loader2, WifiOff } from 'lucide-react';
import { useBranding } from '@/contexts/BrandingContext';
import { useCustomAuth } from '@/hooks/useCustomAuth';

interface AuthButtonProps {
  loading: boolean;
  phone: string;
  checkingUser: boolean;
  userCheckComplete: boolean;
  isNewUser: boolean;
  onContinue?: () => void;
}

export const AuthButton = ({ 
  loading, 
  phone, 
  checkingUser, 
  userCheckComplete, 
  isNewUser,
  onContinue
}: AuthButtonProps) => {
  const { branding } = useBranding();
  const { isOnline } = useCustomAuth();
  
  const isDisabled = loading || phone.length < 10 || checkingUser || !userCheckComplete || (isNewUser && !isOnline);
  const primaryColor = branding?.primaryColor || '#8BC34A';
  
  const getButtonText = () => {
    if (loading) {
      return userCheckComplete && isNewUser ? 'Creating Account...' : 'Signing In...';
    }
    if (checkingUser) {
      return 'Checking...';
    }
    if (userCheckComplete) {
      if (isNewUser && !isOnline) {
        return 'Registration Requires Internet';
      }
      return isNewUser ? 'Create Account & Continue' : 'Sign In & Continue';
    }
    return 'Continue';
  };

  const getButtonColor = () => {
    if (isDisabled) {
      return 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed';
    }
    if (userCheckComplete) {
      return isNewUser ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700';
    }
    return '';
  };
  
  return (
    <Button 
      type="submit" 
      onClick={onContinue}
      className={`w-full h-12 text-base font-medium rounded-xl transition-all duration-200 text-white ${getButtonColor()}`}
      style={{
        backgroundColor: isDisabled ? undefined : (userCheckComplete ? undefined : primaryColor),
      }}
      disabled={isDisabled}
    >
      {loading ? (
        <div className="flex items-center space-x-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{getButtonText()}</span>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          {isNewUser && !isOnline && <WifiOff className="w-4 h-4" />}
          <span>{getButtonText()}</span>
        </div>
      )}
    </Button>
  );
};
