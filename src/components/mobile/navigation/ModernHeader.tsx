
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { HamburgerMenu } from './HamburgerMenu';

export const ModernHeader: React.FC = () => {
  const { isOnline } = useSelector((state: RootState) => state.sync);
  const { currentTenant, tenantBranding } = useSelector((state: RootState) => state.tenant);

  return (
    <header 
      className="sticky top-0 z-40 w-full backdrop-blur-lg bg-background/80 border-b border-border/50 safe-area-top"
      style={{
        background: tenantBranding?.background_color 
          ? `linear-gradient(135deg, ${tenantBranding.background_color}cc, ${tenantBranding.primary_color || '#ffffff'}08)`
          : undefined
      }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Logo and App Info */}
        <div className="flex items-center space-x-3">
          {tenantBranding?.logo_url && (
            <img 
              src={tenantBranding.logo_url} 
              alt={tenantBranding.app_name || 'Logo'}
              className="w-8 h-8 rounded-lg ring-2 ring-primary/20 object-cover"
            />
          )}
          <div>
            <h1 className="text-lg font-bold text-foreground">
              {tenantBranding?.app_name || currentTenant?.name || 'KisanShakti AI'}
            </h1>
            {tenantBranding?.app_tagline && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {tenantBranding.app_tagline}
              </p>
            )}
          </div>
        </div>

        {/* Right: Status and Actions */}
        <div className="flex items-center space-x-2">
          <Badge 
            variant={isOnline ? 'default' : 'secondary'} 
            className="text-xs px-2 py-1 rounded-full"
            style={{
              backgroundColor: isOnline && tenantBranding?.primary_color 
                ? tenantBranding.primary_color 
                : undefined
            }}
          >
            {isOnline ? '●' : '○'} {isOnline ? 'Online' : 'Offline'}
          </Badge>
          
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center">
              <span className="text-xs text-destructive-foreground font-bold">3</span>
            </div>
          </Button>

          <HamburgerMenu />
        </div>
      </div>
    </header>
  );
};
