
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  MapPin,
  MessageCircle,
  Calendar,
  TrendingUp,
  Users,
  User,
} from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    {
      key: 'home',
      icon: Home,
      label: t('navigation.home'),
      path: '/',
    },
    {
      key: 'lands',
      icon: MapPin,
      label: t('navigation.my_lands'),
      path: '/my-lands',
    },
    {
      key: 'ai-chat',
      icon: MessageCircle,
      label: t('navigation.ai_chat'),
      path: '/ai-chat',
    },
    {
      key: 'schedule',
      icon: Calendar,
      label: t('navigation.crop_schedule'),
      path: '/crop-schedule',
    },
    {
      key: 'market',
      icon: TrendingUp,
      label: t('navigation.market'),
      path: '/market',
    },
  ];

  return (
    <div className="bg-background border-t border-border safe-area-bottom">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
