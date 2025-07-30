
import { useTranslation } from 'react-i18next';
import { useUnifiedTenantData } from '@/hooks';
import { MessageCircle, Users, Leaf, Shield } from 'lucide-react';

export const FeaturesInfo = () => {
  const { t } = useTranslation();
  const { branding } = useUnifiedTenantData();
  
  // Use tenant icons if available, fallback to default icons
  const getFeatureIcon = (iconName: string, DefaultIcon: any) => {
    const tenantIcon = branding?.feature_icons?.[iconName];
    if (tenantIcon) {
      return () => <img src={tenantIcon} alt={iconName} className="w-8 h-8" />;
    }
    return DefaultIcon;
  };

  const features = [
    {
      icon: getFeatureIcon('ai_chat', MessageCircle),
      title: t('features.aiChat.title'),
      description: t('features.aiChat.shortDesc')
    },
    {
      icon: getFeatureIcon('community', Users),
      title: t('features.community.title'), 
      description: t('features.community.shortDesc')
    },
    {
      icon: getFeatureIcon('smart_farming', Leaf),
      title: t('features.cropSchedule.title'),
      description: t('features.cropSchedule.shortDesc')
    },
    {
      icon: getFeatureIcon('secure', Shield),
      title: t('common.secure'),
      description: t('auth.dataProtected')
    }
  ];

  return (
    <div className="mt-6 pt-4">
      <div className="grid grid-cols-2 gap-3 mb-4">
        {features.map((feature, index) => (
          <div key={index} className="text-center p-3 bg-gray-50 rounded-xl">
            <div className="w-8 h-8 mx-auto mb-2 text-gray-600">
              <feature.icon className="w-full h-full" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              {feature.title}
            </h3>
            <p className="text-xs text-gray-600 leading-tight line-clamp-2">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
      
      <div className="text-center">
        <p className="text-xs text-gray-500 line-clamp-2">
          {t('auth.secureAuth')}
        </p>
      </div>
    </div>
  );
};
