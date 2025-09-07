
import { useTranslation } from 'react-i18next';
import { useUnifiedTenantData } from '@/hooks';
import { tenantTheme } from '@/services/TenantThemeService';

interface AuthHeaderProps {
  userCheckComplete: boolean;
  isNewUser: boolean;
}

export const AuthHeader = ({ userCheckComplete, isNewUser }: AuthHeaderProps) => {
  const { t } = useTranslation();
  const { branding } = useUnifiedTenantData();
  
  // Get theme-based branding
  const themeBranding = tenantTheme.getBranding();
  const logoUrl = branding?.logo_url || themeBranding.logoUrl;
  const appName = branding?.app_name || themeBranding.appName;
  const tagline = branding?.app_tagline || themeBranding.appTagline;

  return (
    <div className="text-center pt-4 pb-2">
      <div className="flex justify-center items-center mb-4">
        <div className="w-16 h-16 bg-card rounded-2xl shadow-sm flex items-center justify-center border border-border">
          <img 
            src={logoUrl}
            alt={appName}
            className="w-12 h-12 object-contain" 
          />
        </div>
      </div>
      
      <h1 className="text-2xl font-bold text-foreground mb-2">
        {t('common.welcome')}
      </h1>
      
      <p className="text-muted-foreground text-base whitespace-nowrap overflow-hidden">
        {tagline}
      </p>
    </div>
  );
};
