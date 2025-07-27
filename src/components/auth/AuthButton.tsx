
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { tenantBranding } = useSelector((state: RootState) => state.tenant);
  
  const isDisabled = loading || phone.length < 10 || checkingUser;
  const primaryColor = tenantBranding?.primary_color || '#8BC34A';
  
  // Show different text based on state
  const getButtonText = () => {
    if (loading) {
      return userCheckComplete && isNewUser ? t('auth.creatingAccount') : t('auth.signingIn');
    }
    
    if (userCheckComplete) {
      return isNewUser ? t('auth.getStarted') : t('common.continue');
    }
    
    // Default text when user check hasn't completed (including connection errors)
    return t('common.continue');
  };
  
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
          <span>{getButtonText()}</span>
        </div>
      ) : (
        <span>{getButtonText()}</span>
      )}
    </Button>
  );
};
