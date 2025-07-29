import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/components/providers/LanguageProvider';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Bell,
  Lock,
  HelpCircle,
  Info,
  Languages,
  Smartphone,
  Globe,
  Star,
  TrendingUp,
  MessageSquare,
  Calendar,
  CreditCard,
} from 'lucide-react';

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path?: string;
  action?: () => void;
  description: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  isNew?: boolean;
  isHot?: boolean;
}

export const ProfessionalHamburgerMenu: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  const { changeLanguage, currentLanguage, supportedLanguages, isChangingLanguage } = useLanguage();
  const { tenantBranding } = useSelector((state: RootState) => state.tenant);
  const [isOpen, setIsOpen] = useState(false);

  const menuSections: MenuSection[] = [
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
        {
          icon: Bell,
          label: t('menu.notifications'),
          path: '/notifications',
          description: 'Manage your notification preferences',
          badge: '3',
          badgeVariant: 'destructive',
        },
        {
          icon: Lock,
          label: t('menu.privacy'),
          path: '/privacy',
          description: 'Privacy and security settings',
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
          isNew: true,
        },
        {
          icon: MessageSquare,
          label: 'Forum Discussions',
          path: '/forum',
          description: 'Join farming discussions',
          badge: 'Active',
          badgeVariant: 'secondary',
        },
        {
          icon: FileText,
          label: t('menu.reports'),
          path: '/analytics',
          description: t('menu.reportsDesc'),
        },
        {
          icon: TrendingUp,
          label: 'Performance Analytics',
          path: '/performance',
          description: 'Track your farming progress',
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
          isHot: true,
        },
        {
          icon: Shield,
          label: t('menu.insurance'),
          path: '/insurance',
          description: t('menu.insuranceDesc'),
        },
        {
          icon: CreditCard,
          label: 'Loans & Credit',
          path: '/loans',
          description: 'Agricultural loan services',
          badge: 'New',
          badgeVariant: 'secondary',
        },
        {
          icon: Calendar,
          label: 'Extension Services',
          path: '/extension',
          description: 'Agricultural extension support',
        },
      ]
    },
    {
      title: 'Support',
      items: [
        {
          icon: HelpCircle,
          label: t('menu.help'),
          path: '/help',
          description: 'Get help and support',
        },
        {
          icon: Info,
          label: t('menu.about'),
          path: '/about',
          description: 'About KisanShakti AI',
        },
      ]
    }
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      setIsOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await changeLanguage(languageCode);
    } catch (error) {
      console.error('Language change error:', error);
    }
  };

  const getProfileName = (): string => {
    if (profile?.full_name) return profile.full_name;
    return t('common.farmer');
  };

  const getInitials = (): string => {
    const name = getProfileName();
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getBadgeVariant = (item: MenuItem) => {
    if (item.isHot) return 'destructive';
    if (item.isNew) return 'secondary';
    return item.badgeVariant || 'outline';
  };

  const getBadgeText = (item: MenuItem) => {
    if (item.isHot) return 'Hot';
    if (item.isNew) return 'New';
    return item.badge || '';
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative w-10 h-10 rounded-xl hover:bg-muted/80 transition-all duration-200"
          aria-label={t('menu.title')}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="right" 
        className="w-80 p-0 bg-gradient-to-br from-background via-background to-muted/20 backdrop-blur-xl border-l border-border/30"
      >
        <div className="flex flex-col h-full">
          {/* Enhanced Header with Glassmorphism */}
          <SheetHeader className="p-6 pb-4">
            <div 
              className="rounded-2xl p-5 backdrop-blur-md border border-white/10 shadow-lg"
              style={{
                background: tenantBranding?.primary_color 
                  ? `linear-gradient(135deg, ${tenantBranding.primary_color}10, ${tenantBranding.accent_color || tenantBranding.primary_color}05)`
                  : 'linear-gradient(135deg, hsl(var(--primary))10, hsl(var(--accent))05)'
              }}
            >
              <div className="flex items-center space-x-4">
                <Avatar className="w-14 h-14 ring-2 ring-primary/20 shadow-lg">
                  <AvatarImage src={profile?.avatar_url} alt={getProfileName()} />
                  <AvatarFallback 
                    className="text-lg font-bold"
                    style={{
                      backgroundColor: tenantBranding?.primary_color ? `${tenantBranding.primary_color}20` : undefined,
                      color: tenantBranding?.primary_color || undefined
                    }}
                  >
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <SheetTitle className="text-xl font-bold text-left mb-1">
                    {getProfileName()}
                  </SheetTitle>
                  <p className="text-sm text-muted-foreground mb-2">
                    Farmer Profile
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {tenantBranding?.app_name || 'KisanShakti AI'}
                  </Badge>
                </div>
              </div>
            </div>
          </SheetHeader>

          {/* Language Selector */}
          <div className="px-6 py-3">
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-card/50 border border-border/30">
              <div className="p-2 rounded-lg bg-primary/10">
                <Languages className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-foreground mb-1 block">
                  {t('common.language')}
                </label>
                <Select 
                  value={currentLanguage} 
                  onValueChange={handleLanguageChange}
                  disabled={isChangingLanguage}
                >
                  <SelectTrigger className="h-8 text-xs border-0 bg-transparent p-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedLanguages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        <div className="flex items-center space-x-2">
                          <Globe className="w-3 h-3" />
                          <span>{lang.nativeName}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Menu Content with ScrollArea */}
          <ScrollArea className="flex-1 px-6">
            <div className="space-y-6 pb-6">
              {menuSections.map((section, sectionIndex) => (
                <div key={sectionIndex}>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center">
                    {section.title}
                    <div className="ml-2 h-px bg-border/50 flex-1" />
                  </h3>
                  <div className="space-y-2">
                    {section.items.map((item, itemIndex) => {
                      const Icon = item.icon;
                      const hasAction = item.action || item.path;
                      
                      return (
                        <button
                          key={itemIndex}
                          onClick={() => {
                            if (item.action) {
                              item.action();
                            } else if (item.path) {
                              handleNavigate(item.path);
                            }
                          }}
                          disabled={!hasAction}
                          className="w-full flex items-center space-x-3 p-3 rounded-xl bg-card/50 hover:bg-accent/50 transition-all duration-300 group border border-transparent hover:border-border/50 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div 
                            className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-105"
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
                                {(item.badge || item.isNew || item.isHot) && (
                                  <Badge 
                                    variant={getBadgeVariant(item)} 
                                    className="text-xs px-2 py-0.5 font-medium"
                                  >
                                    {getBadgeText(item)}
                                  </Badge>
                                )}
                                {hasAction && (
                                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform duration-300" />
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Enhanced Footer */}
          <div className="p-6 pt-4 border-t border-border/30 bg-muted/20 backdrop-blur-sm">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full justify-start space-x-3 h-12 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50 transition-all duration-300 font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('menu.logout')}</span>
            </Button>
            <div className="mt-3 text-center">
              <p className="text-xs text-muted-foreground">
                {t('common.version')} 2.0.0 • KisanShakti AI
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};