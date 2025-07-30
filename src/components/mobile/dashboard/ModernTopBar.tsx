
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useUnifiedTenantData } from '@/hooks';
import { Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProfessionalHamburgerMenu } from '@/components/mobile/navigation/ProfessionalHamburgerMenu';

export const ModernTopBar: React.FC = () => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { branding } = useUnifiedTenantData();
  
  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return 'F';
  };

  return (
    <header 
      className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/50 safe-area-top"
      style={{
        background: branding?.background_color 
          ? `${branding.background_color}95`
          : undefined
      }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Tenant Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            {branding?.logo_url ? (
              <img
                src={branding.logo_url}
                alt={branding.app_name || 'Logo'}
                className="w-8 h-8 object-contain"
              />
            ) : (
              <span 
                className="text-lg font-bold"
                style={{ color: branding?.primary_color }}
              >
                🌾
              </span>
            )}
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {branding?.app_name || 'KisanShakti AI'}
            </h1>
          </div>
        </div>

        {/* Right: Notifications and Menu */}
        <div className="flex items-center space-x-3">
          {/* Notification Bell */}
          <Button
            variant="ghost"
            size="sm"
            className="relative w-10 h-10 rounded-xl hover:bg-muted/80 transition-all duration-200"
            aria-label={t('common.notifications')}
          >
            <Bell className="w-5 h-5" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full border-2 border-background" />
          </Button>

          {/* Professional Hamburger Menu */}
          <ProfessionalHamburgerMenu />
        </div>
      </div>
    </header>
  );
};
