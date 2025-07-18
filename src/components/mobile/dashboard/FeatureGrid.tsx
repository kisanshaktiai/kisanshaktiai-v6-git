
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { ProfileCompletionModal } from '@/components/common/ProfileCompletionModal';
import { 
  MapPin, 
  Calendar, 
  MessageCircle, 
  CloudSun, 
  ShoppingCart, 
  BarChart3, 
  Users, 
  Satellite,
  FileText,
  Shield,
  Lock
} from 'lucide-react';

interface FeatureModule {
  id: string;
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  route: string;
  color: string;
  bgColor: string;
  isNew?: boolean;
  isComingSoon?: boolean;
  tenantFeature?: string;
  requiresProfile?: boolean;
}

export const FeatureGrid: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tenantFeatures } = useSelector((state: RootState) => state.tenant);
  const { isProfileComplete, refreshProfileStatus } = useProfileCompletion();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<string>('');

  const features: FeatureModule[] = [
    {
      id: 'my-lands',
      icon: MapPin,
      title: t('features.myLands', 'My Lands'),
      description: t('features.myLandsDesc', 'Manage your fields'),
      route: '/my-lands',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500',
      requiresProfile: true
    },
    {
      id: 'crop-schedule',
      icon: Calendar,
      title: t('features.cropSchedule', 'Crop Calendar'),
      description: t('features.cropScheduleDesc', 'AI-powered schedule'),
      route: '/crop-schedule',
      color: 'text-green-600',
      bgColor: 'bg-green-500',
      requiresProfile: true
    },
    {
      id: 'ai-chat',
      icon: MessageCircle,
      title: t('features.aiChat', 'AI Assistant'),
      description: t('features.aiChatDesc', 'Get farming advice'),
      route: '/ai-chat',
      color: 'text-blue-600',
      bgColor: 'bg-blue-500',
      tenantFeature: 'ai_chat',
      requiresProfile: true
    },
    {
      id: 'weather',
      icon: CloudSun,
      title: t('features.weather', 'Weather'),
      description: t('features.weatherDesc', 'Hyperlocal forecast'),
      route: '/weather',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-500',
      tenantFeature: 'weather_forecast'
    },
    {
      id: 'marketplace',
      icon: ShoppingCart,
      title: t('features.marketplace', 'Marketplace'),
      description: t('features.marketplaceDesc', 'Buy & Sell'),
      route: '/marketplace',
      color: 'text-orange-600',
      bgColor: 'bg-orange-500',
      tenantFeature: 'marketplace',
      requiresProfile: true
    },
    {
      id: 'analytics',
      icon: BarChart3,
      title: t('features.analytics', 'Analytics'),
      description: t('features.analyticsDesc', 'Insights & reports'),
      route: '/analytics',
      color: 'text-purple-600',
      bgColor: 'bg-purple-500',
      tenantFeature: 'basic_analytics',
      requiresProfile: true
    },
    {
      id: 'community',
      icon: Users,
      title: t('features.community', 'Community'),
      description: t('features.communityDesc', 'Connect with farmers'),
      route: '/community',
      color: 'text-pink-600',
      bgColor: 'bg-pink-500',
      tenantFeature: 'community_forum'
    },
    {
      id: 'satellite',
      icon: Satellite,
      title: t('features.satellite', 'Satellite Data'),
      description: t('features.satelliteDesc', 'NDVI & crop health'),
      route: '/satellite',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-500',
      tenantFeature: 'satellite_imagery',
      isNew: true,
      requiresProfile: true
    },
    {
      id: 'reports',
      icon: FileText,
      title: t('features.reports', 'Reports'),
      description: t('features.reportsDesc', 'Yield logs & documents'),
      route: '/reports',
      color: 'text-gray-600',
      bgColor: 'bg-gray-500',
      requiresProfile: true
    },
    {
      id: 'schemes',
      icon: Shield,
      title: t('features.schemes', 'Schemes'),
      description: t('features.schemesDesc', 'Govt subsidies & insurance'),
      route: '/schemes',
      color: 'text-teal-600',
      bgColor: 'bg-teal-500'
    }
  ];

  const isFeatureEnabled = (feature: FeatureModule): boolean => {
    if (!feature.tenantFeature) return true;
    // Safely check if tenantFeatures exists and has the property
    return tenantFeatures?.[feature.tenantFeature as keyof typeof tenantFeatures] ?? true;
  };

  const availableFeatures = features.filter(isFeatureEnabled);

  const handleFeatureClick = (feature: FeatureModule) => {
    if (feature.isComingSoon) return;
    
    // Check if feature requires profile completion
    if (feature.requiresProfile && !isProfileComplete) {
      setSelectedFeature(feature.title);
      setShowProfileModal(true);
      return;
    }
    
    navigate(feature.route);
  };

  const handleProfileComplete = () => {
    refreshProfileStatus();
  };

  const isFeatureLocked = (feature: FeatureModule): boolean => {
    return feature.requiresProfile && !isProfileComplete;
  };

  return (
    <div className="px-4 py-3">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {t('dashboard.features', 'Features')}
      </h2>
      
      <div className="grid grid-cols-2 gap-4">
        {availableFeatures.map((feature) => {
          const Icon = feature.icon;
          const isLocked = isFeatureLocked(feature);
          
          return (
            <Card 
              key={feature.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md active:scale-95 ${
                feature.isComingSoon ? 'opacity-60' : ''
              } ${isLocked ? 'opacity-75' : ''}`}
              onClick={() => handleFeatureClick(feature)}
            >
              <CardContent className="p-4 text-center relative">
                {feature.isNew && (
                  <Badge className="absolute top-2 right-2 text-xs bg-red-500">
                    {t('common.new', 'New')}
                  </Badge>
                )}
                
                {isLocked && (
                  <div className="absolute top-2 left-2">
                    <Lock className="w-4 h-4 text-orange-500" />
                  </div>
                )}
                
                <div className={`w-12 h-12 ${feature.bgColor} rounded-xl flex items-center justify-center mb-3 mx-auto ${
                  isLocked ? 'opacity-70' : ''
                }`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                
                <h3 className="font-medium text-gray-900 mb-1 text-sm">
                  {feature.title}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {isLocked ? 'Complete profile to unlock' : feature.description}
                </p>
                
                {feature.isComingSoon && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {t('common.comingSoon', 'Coming Soon')}
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ProfileCompletionModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onComplete={handleProfileComplete}
        featureName={selectedFeature}
      />
    </div>
  );
};
