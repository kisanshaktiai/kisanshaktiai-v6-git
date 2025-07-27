
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MapPin, 
  Calendar, 
  Beaker, 
  MessageCircle, 
  Satellite, 
  TrendingUp,
  Sprout,
  Users,
  BarChart3
} from 'lucide-react';

export const CoreFeatureGrid: React.FC = () => {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();

  const coreFeatures = [
    {
      id: 'my-lands',
      title: t('features.myLands.title'),
      description: t('features.myLands.description'),
      icon: MapPin,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      path: '/mobile/my-lands',
      isNew: false
    },
    {
      id: 'ai-chat',
      title: t('features.aiChat.title'),
      description: t('features.aiChat.description'),
      icon: MessageCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      path: '/mobile/ai-chat',
      isNew: true
    },
    {
      id: 'crop-schedule',
      title: t('features.cropSchedule.title'),
      description: t('features.cropSchedule.description'),
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      path: '/mobile/crop-schedule',
      isNew: false
    },
    {
      id: 'fertilizer-guide',
      title: t('features.fertilizerGuide.title'),
      description: t('features.fertilizerGuide.description'),
      icon: Beaker,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      path: '/mobile/fertilizer-guide',
      isNew: false
    },
    {
      id: 'satellite-data',
      title: t('features.satelliteData.title'),
      description: t('features.satelliteData.description'),
      icon: Satellite,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      path: '/mobile/satellite-monitoring',
      isNew: true
    },
    {
      id: 'market',
      title: t('features.market.title'),
      description: t('features.market.description'),
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      path: '/mobile/market',
      isNew: false
    },
    {
      id: 'community',
      title: 'Community',
      description: 'Connect with farmers',
      icon: Users,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      path: '/mobile/community',
      isNew: false
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'Farm insights & reports',
      icon: BarChart3,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      path: '/mobile/analytics',
      isNew: false
    }
  ];

  const handleFeatureClick = (feature: typeof coreFeatures[0]) => {
    navigate(feature.path);
  };

  return (
    <div className="space-y-3">
      <div className="px-4">
        <h3 className="text-lg font-semibold text-foreground">{t('features.title')}</h3>
        <p className="text-sm text-muted-foreground">{t('features.subtitle')}</p>
      </div>

      <div className="px-4">
        <div className="grid grid-cols-2 gap-3">
          {coreFeatures.map((feature, index) => (
            <Card
              key={feature.id}
              className="relative bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 hover:scale-105 transition-all duration-200 cursor-pointer group"
              onClick={() => handleFeatureClick(feature)}
            >
              <CardContent className="p-4">
                {feature.isNew && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg">
                    {t('features.new')}
                  </div>
                )}

                <div className="flex flex-col items-center text-center space-y-3">
                  <div className={`p-3 rounded-2xl ${feature.bgColor} group-hover:scale-110 transition-transform duration-200`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-foreground line-clamp-1">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
