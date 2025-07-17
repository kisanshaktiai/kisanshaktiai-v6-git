import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

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
  return (
    <Button 
      type="submit" 
      className={`w-full text-lg font-semibold transition-all duration-300 ${
        userCheckComplete && isNewUser 
          ? 'bg-green-600 hover:bg-green-700 border-green-500' 
          : userCheckComplete && !isNewUser 
          ? 'bg-blue-600 hover:bg-blue-700 border-blue-500' 
          : 'bg-primary hover:bg-primary/90'
      }`}
      disabled={loading || phone.length < 10 || checkingUser}
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          {userCheckComplete && isNewUser ? 'Creating Account...' : 'Signing In...'}
        </>
      ) : (
        <>
          {userCheckComplete && isNewUser 
            ? 'Create Account & Continue' 
            : userCheckComplete && !isNewUser 
            ? 'Sign In & Continue' 
            : 'Continue'
          }
        </>
      )}
    </Button>
  );
};