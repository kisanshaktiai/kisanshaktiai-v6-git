
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Cloud, TrendingUp, Bug, Sprout, MapPin, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface QuickActionsProps {
  onAction: (action: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onAction }) => {
  const { t } = useTranslation();

  const quickActions = [
    {
      id: 'weather',
      icon: Cloud,
      label: t('Weather'),
      labelHi: 'मौसम',
      color: 'text-blue-600',
    },
    {
      id: 'market_price',
      icon: TrendingUp,
      label: t('Market Prices'),
      labelHi: 'बाजार भाव',
      color: 'text-green-600',
    },
    {
      id: 'disease_help',
      icon: Bug,
      label: t('Disease Help'),
      labelHi: 'रोग मदद',
      color: 'text-red-600',
    },
    {
      id: 'crop_advice',
      icon: Sprout,
      label: t('Crop Advice'),
      labelHi: 'फसल सलाह',
      color: 'text-emerald-600',
    },
    {
      id: 'fertilizer',
      icon: Sprout,
      label: t('Fertilizer'),
      labelHi: 'खाद',
      color: 'text-purple-600',
    },
    {
      id: 'schedule',
      icon: Calendar,
      label: t('Schedule'),
      labelHi: 'कार्यक्रम',
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="border-t bg-muted/30 p-3">
      <ScrollArea className="w-full">
        <div className="flex space-x-2 pb-1">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                onClick={() => onAction(action.id)}
                className="flex-shrink-0 flex flex-col items-center space-y-1 h-auto py-2 px-3 min-w-[60px]"
              >
                <Icon className={`h-4 w-4 ${action.color}`} />
                <span className="text-xs whitespace-nowrap">
                  {action.label}
                </span>
              </Button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
