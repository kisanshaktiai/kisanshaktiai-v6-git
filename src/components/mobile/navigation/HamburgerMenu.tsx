
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { useUnifiedTenantData } from '@/hooks';
import { logout } from '@/store/slices/authSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Menu, 
  User, 
  Settings, 
  LogOut, 
  HelpCircle, 
  Shield, 
  MapPin,
  Phone,
  Globe,
  X
} from 'lucide-react';

interface HamburgerMenuProps {
  className?: string;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ className }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentTenant, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { tenant, branding } = useUnifiedTenantData(currentTenant);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleLogout = () => {
    dispatch(logout());
    setIsOpen(false);
    navigate('/auth');
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const menuItems = [
    {
      icon: User,
      label: t('menu.profile'),
      path: '/profile',
      description: t('menu.profileDesc', 'Manage your account settings')
    },
    {
      icon: MapPin,
      label: t('menu.myLands'),
      path: '/my-lands',
      description: t('menu.myLandsDesc', 'View and manage your farms')
    },
    {
      icon: Settings,
      label: t('menu.settings'),
      path: '/settings',
      description: t('menu.settingsDesc', 'App preferences and configuration')
    },
    {
      icon: HelpCircle,
      label: t('menu.help'),
      path: '/help',
      description: t('menu.helpDesc', 'Get support and tutorials')
    }
  ];

  return (
    <div className={className} ref={menuRef}>
      {/* Menu Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-xl hover:bg-muted/80 transition-all duration-200"
        aria-label={t('menu.toggle')}
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in-0"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Menu Panel */}
      {isOpen && (
        <div className="fixed right-0 top-0 h-full w-80 bg-background border-l shadow-2xl z-50 animate-in slide-in-from-right-full duration-300">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b bg-muted/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {branding?.logo_url && (
                    <img
                      src={branding.logo_url}
                      alt={branding.app_name || 'Logo'}
                      className="w-8 h-8 object-contain"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">
                      {branding?.app_name || 'KisanShakti AI'}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {tenant?.type || 'Agricultural Platform'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* User Status */}
              {isAuthenticated && (
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    <Shield className="w-3 h-3 mr-1" />
                    {t('menu.authenticated')}
                  </Badge>
                </div>
              )}
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {menuItems.map((item) => (
                <Card 
                  key={item.path}
                  className="cursor-pointer hover:shadow-md transition-all duration-200 border-0 bg-muted/20 hover:bg-muted/40"
                  onClick={() => handleNavigation(item.path)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.label}</h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t bg-muted/30 space-y-3">
              {/* Quick Info */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Globe className="w-3 h-3" />
                  <span>{t('common.version')} 1.0</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Phone className="w-3 h-3" />
                  <span>{t('menu.support')}</span>
                </div>
              </div>

              {/* Logout Button */}
              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-start"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {t('auth.logout')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
