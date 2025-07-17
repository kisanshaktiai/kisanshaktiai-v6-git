
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
}

export const AuthButton = ({ 
  loading, 
  phone, 
  checkingUser, 
  userCheckComplete, 
  isNewUser 
}: AuthButtonProps) => {
  const { tenantBranding } = useSelector((state: RootState) => state.tenant);
  
  const isDisabled = loading || phone.length < 10 || checkingUser;
  const primaryColor = tenantBranding?.primary_color || '#8BC34A';
  
  return (
    <Button 
      type="submit" 
      className={`w-full h-12 text-base font-medium rounded-xl transition-all duration-200 ${
        isDisabled 
          ? 'bg-gray-200 text-gray-500 cursor-not-allowed hover:bg-gray-200' 
          : `text-white hover:opacity-90`
      }`}
      style={{
        backgroundColor: isDisabled ? undefined : primaryColor,
      }}
      disabled={isDisabled}
    >
      {loading ? (
        <div className="flex items-center space-x-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>
            {userCheckComplete && isNewUser ? 'Creating Account...' : 'Signing In...'}
          </span>
        </div>
      ) : (
        <span>
          Continue
        </span>
      )}
    </Button>
  );
};
