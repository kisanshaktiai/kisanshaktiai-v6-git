
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

interface AuthHeaderProps {
  userCheckComplete: boolean;
  isNewUser: boolean;
}

export const AuthHeader = ({ userCheckComplete, isNewUser }: AuthHeaderProps) => {
  const { tenantBranding } = useSelector((state: RootState) => state.tenant);
  
  const logoUrl = tenantBranding?.logo_url || '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png';
  const appName = tenantBranding?.app_name || 'KisanShakti AI';
  const tagline = tenantBranding?.app_tagline || 'Your smart farming journey starts here';

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
      
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Welcome Back
      </h1>
      
      <p className="text-gray-600 text-base whitespace-nowrap overflow-hidden">
        {tagline}
      </p>
    </div>
  );
};
