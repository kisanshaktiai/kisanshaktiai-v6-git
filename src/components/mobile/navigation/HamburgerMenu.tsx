
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { logout } from '@/store/slices/authSlice';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Menu,
  User,
  Settings,
  Users,
  FileText,
  Building2,
  Shield,
  LogOut,
  ChevronRight,
} from 'lucide-react';

export const HamburgerMenu: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { phoneNumber } = useSelector((state: RootState) => state.auth);
  const { profile } = useSelector((state: RootState) => state.farmer);
  const { currentTenant, tenantBranding } = useSelector((state: RootState) => state.tenant);

  const menuSections = [
    {
      title: t('menu.account'),
      items: [
        {
          icon: User,
          label: t('menu.profile'),
          path: '/profile',
          description: t('menu.profileDesc'),
        },
        {
          icon: Settings,
          label: t('menu.settings'),
          path: '/settings',
          description: t('menu.settingsDesc'),
        },
      ]
    },
    {
      title: t('menu.community'),
      items: [
        {
          icon: Users,
          label: t('menu.community'),
          path: '/community',
          description: t('menu.communityDesc'),
          badge: 'New',
        },
        {
          icon: FileText,
          label: t('menu.reports'),
          path: '/reports',
          description: t('menu.reportsDesc'),
        },
      ]
    },
    {
      title: t('menu.services'),
      items: [
        {
          icon: Building2,
          label: t('menu.govtSchemes'),
          path: '/govt-schemes',
          description: t('menu.govtSchemesDesc'),
          badge: 'Hot',
        },
        {
          icon: Shield,
          label: t('menu.insurance'),
          path: '/insurance',
          description: t('menu.insuranceDesc'),
        },
      ]
    },
  ];

  const handleLogout = () => {
    dispatch(logout());
  };

  const getProfileName = (): string => {
    if (!profile?.name) return t('common.farmer', 'Farmer');
    if (typeof profile.name === 'string') return profile.name;
    return profile.name.en || profile.name.hi || t('common.farmer', 'Farmer');
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="right" 
        className="w-80 p-0 bg-gradient-to-br from-background via-background to-muted/30 backdrop-blur-xl border-l border-border/50"
      >
        <div className="flex flex-col h-full">
          {/* Header with Profile */}
          <SheetHeader className="p-6 pb-4">
            <div 
              className="rounded-2xl p-4 backdrop-blur-sm"
              style={{
                background: tenantBranding?.primary_color 
                  ? `linear-gradient(135deg, ${tenantBranding.primary_color}15, ${tenantBranding.accent_color || tenantBranding.primary_color}08)`
                  : 'linear-gradient(135deg, hsl(var(--primary))15, hsl(var(--accent))08)'
              }}
            >
              <div className="flex items-center space-x-3">
                <Avatar className="w-12 h-12 ring-2 ring-primary/20">
                  <AvatarFallback 
                    className="text-lg font-semibold"
                    style={{
                      backgroundColor: tenantBranding?.primary_color ? `${tenantBranding.primary_color}20` : undefined,
                      color: tenantBranding?.primary_color || undefined
                    }}
                  >
                    {getProfileName().charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <SheetTitle className="text-lg font-bold text-left">
                    {getProfileName()}
                  </SheetTitle>
                  <p className="text-sm text-muted-foreground">{phoneNumber}</p>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {currentTenant?.name || 'KisanShakti AI'}
                  </Badge>
                </div>
              </div>
            </div>
          </SheetHeader>

          {/* Menu Content */}
          <div className="flex-1 px-6 py-2 space-y-6 overflow-y-auto">
            {menuSections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {section.title}
                </h3>
                <div className="space-y-2">
                  {section.items.map((item, itemIndex) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={itemIndex}
                        onClick={() => navigate(item.path)}
                        className="w-full flex items-center space-x-3 p-3 rounded-xl bg-card/50 hover:bg-accent/50 transition-all duration-200 group border border-transparent hover:border-border/50"
                      >
                        <div 
                          className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors"
                          style={{
                            backgroundColor: tenantBranding?.primary_color ? `${tenantBranding.primary_color}15` : undefined
                          }}
                        >
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-foreground">{item.label}</span>
                            <div className="flex items-center space-x-2">
                              {item.badge && (
                                <Badge 
                                  variant={item.badge === 'Hot' ? 'destructive' : 'secondary'} 
                                  className="text-xs px-2 py-0"
                                >
                                  {item.badge}
                                </Badge>
                              )}
                              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer with Logout */}
          <div className="p-6 pt-4 border-t border-border/50">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full justify-start space-x-3 h-12 rounded-xl border-destructive/20 text-destructive hover:bg-destructive/10 hover:border-destructive/30"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('menu.logout')}</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
