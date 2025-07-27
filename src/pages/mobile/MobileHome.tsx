import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Badge } from '@/components/ui/badge';
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
      {/* Status indicator (compact since header now shows status) */}
      <div className="px-4">
        <div className="flex items-center justify-center">
          <Badge variant={isOnline ? 'default' : 'secondary'} className="bg-green-100 text-green-700">
            {isOnline ? getTranslation('common.online', 'Online') : getTranslation('common.offline', 'Offline')}
          </Badge>
        </div>
      </div>

      {/* Rest of existing content... */}
      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('home.quickActions')}</h2>
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              
                
                  
                    
                      
                    
                    
                      {action.title}
                    
                    
                      {action.description}
                    
                  
                
              
            );
          })}
        </div>
      </div>

      {/* Today's Summary */}
      
        
          
            {t('home.todaysSummary')}
          
        
        
          
            
              {t('home.weather')}
            
            
              28°C, Sunny
            
          
          
            
              {t('home.tasksPending')}
            
            
              3
            
          
          
            
              {t('home.aiMessages')}
            
            
              2 {t('home.newMessages')}
            
          
        
      
    </div>
  );
};
