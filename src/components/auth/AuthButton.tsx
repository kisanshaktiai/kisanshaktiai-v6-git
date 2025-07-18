
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

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
  const { tenantBranding } = useSelector((state: RootState) => state.tenant);
  
  const isDisabled = loading || phone.length < 10 || checkingUser || !userCheckComplete;
  const primaryColor = tenantBranding?.primary_color || '#8BC34A';
  
  const getButtonText = () => {
    if (loading) {
      return userCheckComplete && isNewUser ? 'Creating Account...' : 'Signing In...';
    }
    if (userCheckComplete) {
      return isNewUser ? 'Create Account & Continue' : 'Sign In & Continue';
    }
    return 'Continue';
  };

  const getButtonColor = () => {
    if (userCheckComplete) {
      return isNewUser ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700';
    }
    return 'bg-gray-600 hover:bg-gray-700';
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
        <span>{getButtonText()}</span>
      )}
    </Button>
  );
};
