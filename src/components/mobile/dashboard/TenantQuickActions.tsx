
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { MapPin, MessageCircle, Calendar, Scan, ShoppingCart } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface QuickAction {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
  isPrimary?: boolean;
  description?: string;
}

export const TenantQuickActions: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tenantBranding } = useSelector((state: RootState) => state.tenant);

  const quickActions: QuickAction[] = [
    {
      id: 'land',
      title: t('navigation.my_lands', 'My Lands'),
      icon: MapPin,
      route: '/my-lands',
      description: t('dashboard.actions.land.desc', 'Manage your fields')
    },
    {
      id: 'chat',
      title: t('navigation.ai_chat', 'AI Chat'),
      icon: MessageCircle,
      route: '/ai-chat',
      description: t('dashboard.actions.chat.desc', 'Get farming advice')
    },
    {
      id: 'schedule',
      title: t('navigation.crop_schedule', 'Schedule'),
      icon: Calendar,
      route: '/crop-schedule',
      description: t('dashboard.actions.schedule.desc', 'Plan activities')
    }
  ];

  const primaryActions: QuickAction[] = [
    {
      id: 'scan',
      title: t('navigation.instaScan', 'Insta Scan'),
      icon: Scan,
      route: '/instascan',
      isPrimary: true,
      description: t('dashboard.actions.scan.desc', 'Scan crops instantly')
    }
  ];

  const secondaryActions: QuickAction[] = [
    {
      id: 'market',
      title: t('navigation.market', 'Market'),
      icon: ShoppingCart,
      route: '/market',
      description: t('dashboard.actions.market.desc', 'Buy & sell products')
    }
  ];

  const handleActionClick = (route: string) => {
    navigate(route);
  };

  const ActionButton: React.FC<{ action: QuickAction; className?: string }> = ({ 
    action, 
    className = '' 
  }) => {
    const Icon = action.icon;
    
    return (
      <Card
        className={`cursor-pointer transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${className}`}
        onClick={() => handleActionClick(action.route)}
      >
        <div className="p-4 text-center">
          <div 
            className={`mx-auto mb-3 rounded-xl flex items-center justify-center ${
              action.isPrimary 
                ? 'w-14 h-14 text-white' 
                : 'w-12 h-12 bg-primary/10 text-primary'
            }`}
            style={action.isPrimary ? {
              background: `linear-gradient(135deg, ${tenantBranding?.primary_color || '#10b981'}, ${tenantBranding?.accent_color || '#059669'})`
            } : undefined}
          >
            <Icon className={action.isPrimary ? 'w-7 h-7' : 'w-6 h-6'} />
          </div>
          <h3 className={`font-semibold ${action.isPrimary ? 'text-base' : 'text-sm'} text-foreground`}>
            {action.title}
          </h3>
          {action.description && (
            <p className="text-xs text-muted-foreground mt-1">
              {action.description}
            </p>
          )}
        </div>
      </Card>
    );
  };

  // Combine all actions for proper 3x3 grid
  const allActions = [...quickActions, ...primaryActions, ...secondaryActions];

  return (
    <div className="px-4 mb-4">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-foreground mb-1">
          {t('dashboard:quickActions.title')}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t('dashboard:quickActions.subtitle')}
        </p>
      </div>
      
      {/* 3x3 Grid Layout */}
      <div className="grid grid-cols-3 gap-3">
        {allActions.slice(0, 6).map((action) => (
          <ActionButton key={action.id} action={action} />
        ))}
      </div>
    </div>
  );
};
