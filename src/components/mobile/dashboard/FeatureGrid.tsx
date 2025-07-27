
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
  Lock,
  Sparkles,
  Zap,
  Star,
  Crown
} from 'lucide-react';

interface FeatureModule {
  id: string;
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  route: string;
  gradient: string;
  isNew?: boolean;
  isComingSoon?: boolean;
  isPremium?: boolean;
  tenantFeature?: string;
  requiresProfile?: boolean;
  usageCount?: number;
  popularRank?: number;
}

const FeatureCard: React.FC<{
  feature: FeatureModule;
  isLocked: boolean;
  onClick: () => void;
  index: number;
}> = ({ feature, isLocked, onClick, index }) => {
  const Icon = feature.icon;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card 
      className={`
        relative cursor-pointer transition-all duration-500 hover:shadow-2xl active:scale-95 
        border-0 shadow-lg backdrop-blur-sm overflow-hidden group animate-fade-in
        ${feature.isComingSoon ? 'opacity-75' : ''} 
        ${isLocked ? 'opacity-80' : 'hover:scale-105'}
      `}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        animationDelay: `${index * 100}ms`,
        background: `linear-gradient(135deg, white 0%, ${feature.gradient} 100%)`
      }}
    >
      <CardContent className="p-5 relative">
        {/* Background Effects */}
        <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-${isHovered ? '30' : '20'} transition-opacity duration-300`}></div>
        
        {/* Floating Elements */}
        <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-white/5 rounded-full blur-lg"></div>

        {/* Status Badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {feature.isNew && (
            <Badge className="text-xs bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 shadow-lg animate-pulse">
              <Sparkles className="w-3 h-3 mr-1" />
              New
            </Badge>
          )}
          {feature.isPremium && (
            <Badge className="text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-lg">
              <Crown className="w-3 h-3 mr-1" />
              Pro
            </Badge>
          )}
          {feature.popularRank && feature.popularRank <= 3 && (
            <Badge className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 shadow-lg">
              <Star className="w-3 h-3 mr-1" />
              #{feature.popularRank}
            </Badge>
          )}
        </div>
        
        {isLocked && (
          <div className="absolute top-2 left-2 bg-orange-100 border border-orange-200 rounded-full p-1.5">
            <Lock className="w-3 h-3 text-orange-600" />
          </div>
        )}
        
        {/* Main Content */}
        <div className="relative z-10 space-y-4">
          {/* Icon Container */}
          <div className="relative">
            <div className={`
              w-14 h-14 rounded-2xl flex items-center justify-center 
              shadow-xl border border-white/30 backdrop-blur-sm
              transition-transform duration-300 ${isHovered ? 'scale-110 rotate-3' : ''}
              ${isLocked ? 'opacity-70' : ''}
            `}
            style={{ 
              background: `linear-gradient(135deg, ${feature.gradient})` 
            }}>
              <Icon className="w-7 h-7 text-white drop-shadow-lg" />
            </div>
            
            {/* Glow Effect */}
            {isHovered && !isLocked && (
              <div 
                className="absolute inset-0 w-14 h-14 rounded-2xl blur-md opacity-60 animate-pulse"
                style={{ background: `linear-gradient(135deg, ${feature.gradient})` }}
              ></div>
            )}

            {/* Activity Indicator */}
            {feature.usageCount && feature.usageCount > 0 && !isLocked && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">{feature.usageCount}</span>
              </div>
            )}
          </div>
          
          {/* Text Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm leading-tight">
                {feature.title}
              </h3>
              {!isLocked && !feature.isComingSoon && (
                <Zap className="w-4 h-4 text-yellow-500 opacity-60" />
              )}
            </div>
            
            <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
              {isLocked ? 'Complete your profile to unlock this feature' : feature.description}
            </p>
          </div>

          {/* Action Indicator */}
          {!feature.isComingSoon && !isLocked && (
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500">Tap to open</span>
              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
            </div>
          )}
          
          {feature.isComingSoon && (
            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600 border-gray-200 font-medium">
              Coming Soon
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

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
      description: t('features.myLandsDesc', 'Manage your agricultural fields with GPS mapping'),
      route: '/my-lands',
      gradient: 'from-emerald-400/20 via-green-500/10 to-teal-500/20',
      requiresProfile: true,
      usageCount: 12,
      popularRank: 1
    },
    {
      id: 'ai-chat',
      icon: MessageCircle,
      title: t('features.aiChat', 'AI Assistant'),
      description: t('features.aiChatDesc', 'Get instant farming advice from AI expert'),
      route: '/ai-chat',
      gradient: 'from-blue-400/20 via-indigo-500/10 to-purple-500/20',
      tenantFeature: 'ai_chat',
      requiresProfile: true,
      usageCount: 28,
      popularRank: 2,
      isNew: true
    },
    {
      id: 'weather',
      icon: CloudSun,
      title: t('features.weather', 'Weather Hub'),
      description: t('features.weatherDesc', 'Hyperlocal weather forecasts & farming alerts'),
      route: '/weather',
      gradient: 'from-yellow-400/20 via-orange-500/10 to-red-500/20',
      tenantFeature: 'weather_forecast',
      usageCount: 5
    },
    {
      id: 'crop-schedule',
      icon: Calendar,
      title: t('features.cropSchedule', 'Smart Calendar'),
      description: t('features.cropScheduleDesc', 'AI-powered crop planning & scheduling'),
      route: '/crop-schedule',
      gradient: 'from-green-400/20 via-lime-500/10 to-emerald-500/20',
      requiresProfile: true,
      usageCount: 8,
      popularRank: 3
    },
    {
      id: 'satellite',
      icon: Satellite,
      title: t('features.satellite', 'Satellite Intel'),
      description: t('features.satelliteDesc', 'NDVI analysis & crop health monitoring'),
      route: '/satellite',
      gradient: 'from-indigo-400/20 via-purple-500/10 to-pink-500/20',
      tenantFeature: 'satellite_imagery',
      requiresProfile: true,
      isPremium: true,
      usageCount: 3
    },
    {
      id: 'marketplace',
      icon: ShoppingCart,
      title: t('features.marketplace', 'Marketplace'),
      description: t('features.marketplaceDesc', 'Buy inputs & sell produce directly'),
      route: '/marketplace',
      gradient: 'from-orange-400/20 via-red-500/10 to-pink-500/20',
      tenantFeature: 'marketplace',
      requiresProfile: true,
      usageCount: 15
    },
    {
      id: 'analytics',
      icon: BarChart3,
      title: t('features.analytics', 'Farm Analytics'),
      description: t('features.analyticsDesc', 'Performance insights & profit analysis'),
      route: '/analytics',
      gradient: 'from-purple-400/20 via-violet-500/10 to-indigo-500/20',
      tenantFeature: 'basic_analytics',
      requiresProfile: true,
      usageCount: 6
    },
    {
      id: 'community',
      icon: Users,
      title: t('features.community', 'Farmer Network'),
      description: t('features.communityDesc', 'Connect with local farming community'),
      route: '/community',
      gradient: 'from-pink-400/20 via-rose-500/10 to-red-500/20',
      tenantFeature: 'community_forum',
      usageCount: 22
    },
    {
      id: 'reports',
      icon: FileText,
      title: t('features.reports', 'Smart Reports'),
      description: t('features.reportsDesc', 'Generate yield logs & compliance docs'),
      route: '/reports',
      gradient: 'from-gray-400/20 via-slate-500/10 to-zinc-500/20',
      requiresProfile: true,
      usageCount: 4
    },
    {
      id: 'schemes',
      icon: Shield,
      title: t('features.schemes', 'Govt Schemes'),
      description: t('features.schemesDesc', 'Access subsidies & insurance programs'),
      route: '/schemes',
      gradient: 'from-teal-400/20 via-cyan-500/10 to-blue-500/20',
      usageCount: 7
    }
  ];

  const isFeatureEnabled = (feature: FeatureModule): boolean => {
    if (!feature.tenantFeature) return true;
    return tenantFeatures?.[feature.tenantFeature as keyof typeof tenantFeatures] ?? true;
  };

  const availableFeatures = features.filter(isFeatureEnabled);

  const handleFeatureClick = (feature: FeatureModule) => {
    if (feature.isComingSoon) return;
    
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
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            {t('dashboard.features', 'Farm Tools')}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {t('dashboard.featuresDesc', 'Everything you need to manage your farm')}
          </p>
        </div>
        <Badge 
          variant="secondary" 
          className="bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-blue-200 font-medium"
        >
          {availableFeatures.length} {t('dashboard.tools', 'tools')}
        </Badge>
      </div>
      
      {/* Feature Grid */}
      <div className="grid grid-cols-2 gap-4">
        {availableFeatures.map((feature, index) => (
          <FeatureCard
            key={feature.id}
            feature={feature}
            isLocked={isFeatureLocked(feature)}
            onClick={() => handleFeatureClick(feature)}
            index={index}
          />
        ))}
      </div>

      {/* Quick Stats */}
      <Card className="bg-gradient-to-r from-green-50/50 via-blue-50/50 to-purple-50/50 border-green-100">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {availableFeatures.filter(f => !isFeatureLocked(f)).length}
              </div>
              <div className="text-xs text-gray-600">Available</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {availableFeatures.reduce((sum, f) => sum + (f.usageCount || 0), 0)}
              </div>
              <div className="text-xs text-gray-600">Total Uses</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {availableFeatures.filter(f => f.isNew || f.isPremium).length}
              </div>
              <div className="text-xs text-gray-600">Premium</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ProfileCompletionModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onComplete={handleProfileComplete}
        featureName={selectedFeature}
      />
    </div>
  );
};
