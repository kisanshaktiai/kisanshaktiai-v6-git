
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import {
  Home,
  MessageCircle,
  Satellite,
  TrendingUp,
  Scan,
} from 'lucide-react';

export const ModernBottomNavigation: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { tenantBranding } = useSelector((state: RootState) => state.tenant);

  const navItems = [
    {
      key: 'home',
      icon: Home,
      label: t('navigation.home'),
      path: '/',
    },
    {
      key: 'ai-chat',
      icon: MessageCircle,
      label: t('navigation.aiChat'),
      path: '/ai-chat',
    },
    {
      key: 'instascan',
      icon: Scan,
      label: t('navigation.instaScan'),
      path: '/instascan',
      isFAB: true,
    },
    {
      key: 'satellite',
      icon: Satellite,
      label: t('navigation.satelliteData'),
      path: '/satellite',
    },
    {
      key: 'market',
      icon: TrendingUp,
      label: t('navigation.market'),
      path: '/market',
    },
  ];

  return (
    <div className="relative">
      {/* Modern Navigation Bar with Glassmorphism */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-lg bg-background/80 border-t border-border/50 safe-area-bottom"
        style={{
          background: tenantBranding?.primary_color 
            ? `linear-gradient(135deg, ${tenantBranding.background_color || '#ffffff'}cc, ${tenantBranding.primary_color}11)`
            : undefined
        }}
      >
        <div className="flex justify-around items-center py-2 px-4 relative">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            if (item.isFAB) {
              return (
                <div key={item.key} className="relative -mt-6">
                  <button
                    onClick={() => navigate(item.path)}
                    className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transform transition-all duration-300 hover:scale-110 active:scale-95 ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-primary/50'
                        : 'bg-gradient-to-br from-primary to-primary/80 text-white hover:shadow-primary/30'
                    }`}
                    style={{
                      background: tenantBranding?.primary_color
                        ? `linear-gradient(135deg, ${tenantBranding.primary_color}, ${tenantBranding.accent_color || tenantBranding.primary_color})`
                        : undefined
                    }}
                  >
                    <Icon className="h-7 w-7" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
                  </button>
                  <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs font-medium text-foreground/70 whitespace-nowrap">
                    {item.label}
                  </span>
                </div>
              );
            }
            
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                  isActive
                    ? 'text-primary bg-primary/10 shadow-lg'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
              >
                <div className="relative">
                  <Icon className="h-6 w-6" />
                  {isActive && (
                    <div 
                      className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-primary animate-pulse"
                      style={{
                        backgroundColor: tenantBranding?.primary_color || undefined
                      }}
                    />
                  )}
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Safe area spacer */}
      <div className="h-20"></div>
    </div>
  );
};
