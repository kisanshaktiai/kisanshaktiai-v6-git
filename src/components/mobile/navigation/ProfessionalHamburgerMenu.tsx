
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { useUnifiedTenantData } from '@/hooks';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/store/slices/authSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  X,
  MessageCircle,
  BarChart3,
  Bell,
  CreditCard,
  HeadphonesIcon
} from 'lucide-react';

interface ProfessionalHamburgerMenuProps {
  className?: string;
}

export const ProfessionalHamburgerMenu: React.FC<ProfessionalHamburgerMenuProps> = ({ className }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { profile } = useAuth();
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

  const getLocationString = () => {
    if (profile?.village && profile?.district) {
      return `${profile.village}, ${profile.district}`;
    } else if (profile?.district) {
      return profile.district;
    } else if (profile?.state) {
      return profile.state;
    }
    return 'Location not set';
  };

  const primaryMenuItems = [
    {
      icon: User,
      label: t('menu.profile'),
      path: '/profile',
      description: t('menu.profileDesc', 'Manage your account settings'),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: MapPin,
      label: t('menu.myLands'),
      path: '/my-lands',
      description: t('menu.myLandsDesc', 'View and manage your farms'),
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: MessageCircle,
      label: t('menu.aiChat'),
      path: '/ai-chat',
      description: t('menu.aiChatDesc', 'Get AI farming assistance'),
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: BarChart3,
      label: t('menu.analytics'),
      path: '/analytics',
      description: t('menu.analyticsDesc', 'View farm performance data'),
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  const secondaryMenuItems = [
    {
      icon: Settings,
      label: t('menu.settings'),
      path: '/settings',
      description: t('menu.settingsDesc', 'App preferences and configuration')
    },
    {
      icon: Bell,
      label: t('menu.notifications'),
      path: '/notifications',
      description: t('menu.notificationsDesc', 'Manage your alerts')
    },
    {
      icon: CreditCard,
      label: t('menu.billing'),
      path: '/billing',
      description: t('menu.billingDesc', 'Subscription and payments')
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
        <div className="fixed right-0 top-0 h-full w-96 bg-background border-l shadow-2xl z-50 animate-in slide-in-from-right-full duration-300">
          <div className="flex flex-col h-full">
            {/* Header with User Profile */}
            <div className="p-6 border-b bg-gradient-to-r from-muted/30 to-muted/10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  {branding?.logo_url ? (
                    <img
                      src={branding.logo_url}
                      alt={branding.app_name || 'Logo'}
                      className="w-10 h-10 object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <span className="text-primary font-bold">🌾</span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-lg">
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
                  className="w-8 h-8 hover:bg-muted/60"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* User Profile Section */}
              {isAuthenticated && profile && (
                <div className="flex items-center space-x-4 p-4 bg-white/50 rounded-xl">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={profile.avatar_url || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">
                      {profile.full_name || profile.mobile_number}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {getLocationString()}
                    </p>
                    <Badge variant="secondary" className="text-xs mt-1">
                      <Shield className="w-3 h-3 mr-1" />
                      {t('menu.verified')}
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Primary Actions */}
              <div className="space-y-3">
                <h5 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  {t('menu.mainFeatures')}
                </h5>
                <div className="space-y-2">
                  {primaryMenuItems.map((item) => (
                    <Card 
                      key={item.path}
                      className="cursor-pointer hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-r from-white to-muted/20 hover:from-muted/30 hover:to-muted/40"
                      onClick={() => handleNavigation(item.path)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-4">
                          <div className={`w-12 h-12 rounded-xl ${item.bgColor} flex items-center justify-center`}>
                            <item.icon className={`w-6 h-6 ${item.color}`} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm">{item.label}</h4>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Secondary Actions */}
              <div className="space-y-3">
                <h5 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  {t('menu.settings')}
                </h5>
                <div className="space-y-1">
                  {secondaryMenuItems.map((item) => (
                    <Button
                      key={item.path}
                      variant="ghost"
                      className="w-full justify-start h-auto p-3 hover:bg-muted/60"
                      onClick={() => handleNavigation(item.path)}
                    >
                      <item.icon className="w-4 h-4 mr-3 text-muted-foreground" />
                      <div className="flex-1 text-left">
                        <div className="font-medium text-sm">{item.label}</div>
                        <div className="text-xs text-muted-foreground">{item.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t bg-muted/20 space-y-4">
              {/* Quick Info */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Globe className="w-3 h-3" />
                  <span>{t('common.version')} 1.0.0</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 text-xs"
                  onClick={() => handleNavigation('/support')}
                >
                  <HeadphonesIcon className="w-3 h-3 mr-1" />
                  {t('menu.support')}
                </Button>
              </div>

              {/* Logout Button */}
              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-start hover:bg-destructive/90 transition-colors"
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
