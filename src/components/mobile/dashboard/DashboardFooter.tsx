
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Search, 
  Calendar, 
  MessageCircle, 
  Settings 
} from 'lucide-react';

interface FooterItem {
  id: string;
  icon: React.ComponentType<any>;
  label: string;
  route: string;
  badge?: number;
}

export const DashboardFooter: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { tenantFeatures } = useSelector((state: RootState) => state.tenant);

  const footerItems: FooterItem[] = [
    {
      id: 'home',
      icon: Home,
      label: t('navigation.home', 'Home'),
      route: '/'
    },
    {
      id: 'search',
      icon: Search,
      label: t('navigation.search', 'Search'),
      route: '/search'
    },
    {
      id: 'schedule',
      icon: Calendar,
      label: t('navigation.schedule', 'Schedule'),
      route: '/crop-schedule'
    },
    {
      id: 'chat',
      icon: MessageCircle,
      label: t('navigation.aiChat', 'AI Chat'),
      route: '/ai-chat',
      badge: 1
    },
    {
      id: 'settings',
      icon: Settings,
      label: t('navigation.settings', 'Settings'),
      route: '/settings'
    }
  ];

  const isActive = (route: string) => {
    if (route === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(route);
  };

  const handleItemClick = (item: FooterItem) => {
    navigate(item.route);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 safe-area-pb">
      <div className="flex items-center justify-around">
        {footerItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.route);
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              className={`flex-1 flex flex-col items-center space-y-1 h-auto py-2 relative ${
                active ? 'text-primary' : 'text-gray-600'
              }`}
              onClick={() => handleItemClick(item)}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${active ? 'text-primary' : 'text-gray-600'}`} />
                {item.badge && item.badge > 0 && (
                  <Badge className="absolute -top-2 -right-2 w-4 h-4 rounded-full p-0 flex items-center justify-center text-xs">
                    {item.badge}
                  </Badge>
                )}
              </div>
              <span className={`text-xs ${active ? 'text-primary font-medium' : 'text-gray-600'}`}>
                {item.label}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};
