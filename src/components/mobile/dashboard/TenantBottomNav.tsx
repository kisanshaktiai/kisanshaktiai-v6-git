
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Home, MapPin, MessageCircle, Scan, ShoppingCart } from 'lucide-react';

interface NavItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  isPrimary?: boolean;
}

export const TenantBottomNav: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { tenantBranding } = useSelector((state: RootState) => state.tenant);

  const navItems: NavItem[] = [
    {
      key: 'home',
      label: t('navigation.home', 'Home'),
      icon: Home,
      path: '/'
    },
    {
      key: 'lands',
      label: t('navigation.my_lands', 'My Lands'),
      icon: MapPin,
      path: '/my-lands'
    },
    {
      key: 'scan',
      label: t('navigation.instaScan', 'Scan'),
      icon: Scan,
      path: '/instascan',
      isPrimary: true
    },
    {
      key: 'chat',
      label: t('navigation.ai_chat', 'AI Chat'),
      icon: MessageCircle,
      path: '/ai-chat'
    },
    {
      key: 'market',
      label: t('navigation.market', 'Market'),
      icon: ShoppingCart,
      path: '/market'
    }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/50 safe-area-bottom">
      <div className="flex items-center justify-around py-2 px-4">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          if (item.isPrimary) {
            return (
              <div key={item.key} className="relative -mt-6">
                <button
                  onClick={() => handleNavigation(item.path)}
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transform transition-all duration-300 hover:scale-110 active:scale-95 text-white"
                  style={{
                    background: `linear-gradient(135deg, ${tenantBranding?.primary_color || '#10b981'}, ${tenantBranding?.accent_color || '#059669'})`
                  }}
                  aria-label={item.label}
                >
                  <Icon className="w-7 h-7" />
                  {isActive && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-accent border-2 border-white rounded-full animate-pulse" />
                  )}
                </button>
                <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-muted-foreground whitespace-nowrap">
                  {item.label}
                </span>
              </div>
            );
          }

          return (
            <button
              key={item.key}
              onClick={() => handleNavigation(item.path)}
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 min-w-0 ${
                isActive
                  ? 'text-primary bg-primary/10 shadow-lg'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
              aria-label={item.label}
            >
              <div className="relative">
                <Icon className="w-6 h-6" />
                {isActive && (
                  <div 
                    className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full animate-pulse"
                    style={{
                      backgroundColor: tenantBranding?.primary_color || 'hsl(var(--primary))'
                    }}
                  />
                )}
              </div>
              <span className="text-xs font-medium truncate max-w-16">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
