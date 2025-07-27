
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Sprout, MessageCircle, Calendar, TrendingUp } from 'lucide-react';

export const MobileHome: React.FC = () => {
  const { t } = useTranslation();
  const { profile } = useSelector((state: RootState) => state.farmer);
  const { isOnline } = useSelector((state: RootState) => state.sync);

  const quickActions = [
    {
      icon: MessageCircle,
      title: t('navigation.ai_chat'),
      description: t('home.getFarmingAdvice'),
      color: 'bg-blue-500',
    },
    {
      icon: Calendar,
      title: t('navigation.crop_schedule'),
      description: t('home.viewUpcomingTasks'),
      color: 'bg-green-500',
    },
    {
      icon: TrendingUp,
      title: t('navigation.market'),
      description: t('home.checkLatestRates'),
      color: 'bg-orange-500',
    },
    {
      icon: Sprout,
      title: t('navigation.my_lands'),
      description: t('home.manageYourFields'),
      color: 'bg-emerald-500',
    },
  ];

  // Helper function to safely convert translation result to string
  const getTranslation = (key: string, fallback: string): string => {
    const result = t(key);
    if (typeof result === 'string') return result;
    return fallback;
  };

  const getProfileName = (): string => {
    if (!profile?.name) return getTranslation('common.farmer', 'Farmer');
    if (typeof profile.name === 'string') return profile.name;
    return profile.name.en || profile.name.hi || getTranslation('common.farmer', 'Farmer');
  };

  return (
    <div className="pt-4 space-y-6">
      {/* Status indicator */}
      <div className="px-4">
        <div className="flex items-center justify-center">
          <Badge variant={isOnline ? 'default' : 'secondary'} className="bg-green-100 text-green-700">
            {isOnline ? getTranslation('common.online', 'Online') : getTranslation('common.offline', 'Offline')}
          </Badge>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('home.quickActions')}</h2>
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${action.color}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {action.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Today's Summary */}
      <div className="px-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4">
              {t('home.todaysSummary')}
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-600 mb-1">
                  {t('home.weather')}
                </div>
                <div className="font-semibold text-gray-900">
                  28°C, Sunny
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">
                  {t('home.tasksPending')}
                </div>
                <div className="font-semibold text-gray-900">
                  3
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">
                  {t('home.aiMessages')}
                </div>
                <div className="font-semibold text-gray-900">
                  2 {t('home.newMessages')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
