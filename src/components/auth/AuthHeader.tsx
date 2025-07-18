
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { UserPlus, LogIn } from 'lucide-react';

interface AuthHeaderProps {
  userCheckComplete: boolean;
  isNewUser: boolean;
  currentStep?: 'phone' | 'login' | 'signup';
}

export const AuthHeader = ({ userCheckComplete, isNewUser, currentStep = 'phone' }: AuthHeaderProps) => {
  const { tenantBranding } = useSelector((state: RootState) => state.tenant);
  
  const logoUrl = tenantBranding?.logo_url || '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png';
  const appName = tenantBranding?.app_name || 'KisanShakti AI';
  const tagline = tenantBranding?.app_tagline || 'Your smart farming journey starts here';

  const getHeaderContent = () => {
    switch (currentStep) {
      case 'login':
        return {
          title: 'Welcome Back',
          subtitle: `Continue your smart farming journey with ${appName}`,
          icon: LogIn
        };
      case 'signup':
        return {
          title: 'Create New Account',
          subtitle: 'Join thousands of farmers using AI-powered farming guidance',
          icon: UserPlus
        };
      default:
        if (userCheckComplete && isNewUser) {
          return {
            title: 'Create Account',
            subtitle: 'Join thousands of farmers using AI for better crops',
            icon: UserPlus
          };
        } else if (userCheckComplete && !isNewUser) {
          return {
            title: 'Welcome Back',
            subtitle: 'Your smart farming journey continues here',
            icon: LogIn
          };
        }
        return {
          title: 'Welcome',
          subtitle: tagline,
          icon: LogIn
        };
    }
  };

  const headerContent = getHeaderContent();
  const IconComponent = headerContent.icon;

  return (
    <div className="text-center pt-4 pb-2">
      <div className="flex justify-center items-center mb-4">
        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-gray-100">
          <img 
            src={logoUrl}
            alt={appName}
            className="w-12 h-12 object-contain" 
          />
        </div>
      </div>
      
      <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
        <IconComponent className="w-6 h-6 text-green-600" />
        {headerContent.title}
      </h1>
      
      <p className="text-gray-600 text-base whitespace-nowrap overflow-hidden">
        {headerContent.subtitle}
      </p>
    </div>
  );
};
