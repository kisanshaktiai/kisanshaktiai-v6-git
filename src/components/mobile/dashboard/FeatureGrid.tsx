
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  Cloud,
  ShoppingCart,
  Users,
  MapPin,
  BarChart3,
  Calendar,
  Leaf,
  Satellite,
  MessageSquare
} from 'lucide-react';

interface Feature {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  route: string;
  color: string;
  bgColor: string;
  isNew?: boolean;
  isComingSoon?: boolean;
}

export const FeatureGrid: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const features: Feature[] = [
    {
      id: 'ai-chat',
      title: t('features.aiChat', 'AI Assistant'),
      icon: Bot,
      route: '/mobile/ai-chat',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      isNew: true
    },
    {
      id: 'weather',
      title: t('features.weather', 'Weather'),
      icon: Cloud,
      route: '/mobile/weather',
      color: 'text-sky-600',
      bgColor: 'bg-sky-50'
    },
    {
      id: 'market',
      title: t('features.marketplace', 'Marketplace'),
      icon: ShoppingCart,
      route: '/mobile/market',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: 'community',
      title: t('features.community', 'Community'),
      icon: Users,
      route: '/mobile/community',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: 'my-lands',
      title: t('features.myLands', 'My Lands'),
      icon: MapPin,
      route: '/mobile/my-lands',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      id: 'analytics',
      title: t('features.analytics', 'Analytics'),
      icon: BarChart3,
      route: '/mobile/analytics',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      id: 'crop-schedule',
      title: t('features.cropSchedule', 'Crop Schedule'),
      icon: Calendar,
      route: '/mobile/crop-schedule',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      id: 'satellite',
      title: t('features.satellite', 'Satellite'),
      icon: Satellite,
      route: '/mobile/satellite',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      isComingSoon: true
    }
  ];

  const handleFeatureClick = (feature: Feature) => {
    if (feature.isComingSoon) {
      // Show coming soon message
      console.log(`${feature.title} coming soon!`);
      return;
    }
    
    navigate(feature.route);
  };

  return (
    <div className="px-4 py-3">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        {t('dashboard.features', 'Features')}
      </h2>
      
      <div className="grid grid-cols-2 gap-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card 
              key={feature.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                feature.isComingSoon ? 'opacity-60' : ''
              }`}
              onClick={() => handleFeatureClick(feature)}
            >
              <CardContent className="p-4 text-center">
                <div className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center mx-auto mb-3 relative`}>
                  <Icon className={`w-6 h-6 ${feature.color}`} />
                  {feature.isNew && (
                    <Badge className="absolute -top-1 -right-1 px-1 py-0 text-xs">
                      New
                    </Badge>
                  )}
                </div>
                
                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  {feature.title}
                </h3>
                
                {feature.isComingSoon && (
                  <Badge variant="secondary" className="text-xs">
                    Coming Soon
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
