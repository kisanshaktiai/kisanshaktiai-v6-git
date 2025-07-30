
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { useUnifiedTenantData } from '@/hooks';
import { ModernProfileModal } from '@/components/common/ModernProfileModal';
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
        ${isLocked ? 'opacity-90' : 'hover:scale-105'}
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
        
        {/* Lock Overlay */}
        {isLocked && (
          <div className="absolute inset-0 bg-black/5 backdrop-blur-[1px] rounded-lg flex items-center justify-center z-10">
            <div className="bg-white/95 backdrop-blur-sm rounded-full p-3 shadow-lg border border-white/50">
              <Lock className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        )}
        
        {/* Main Content */}
        <div className="relative z-10 space-y-4">
          {/* Icon Container */}
          <div className="relative">
            <div className={`
              w-14 h-14 rounded-2xl flex items-center justify-center 
              shadow-xl border border-white/30 backdrop-blur-sm
              transition-transform duration-300 ${isHovered && !isLocked ? 'scale-110 rotate-3' : ''}
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
              {isLocked ? 'Complete your profile to unlock this premium feature' : feature.description}
            </p>
          </div>

          {/* Action Indicator */}
          {!feature.isComingSoon && (
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              {isLocked ? (
                <span className="text-xs text-orange-600 font-medium">Complete Profile</span>
              ) : (
                <span className="text-xs text-gray-500">Tap to open</span>
              )}
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                isLocked ? 'bg-orange-400' : 'bg-gradient-to-r from-blue-500 to-purple-500'
              }`}></div>
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
  const { currentTenant } = useSelector((state: RootState) => state.auth);
  const { features: tenantFeatures } = useUnifiedTenantData(currentTenant);
  const { isProfileComplete, refreshProfileStatus } = useProfileCompletion();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<string>('');

  // Define features with profile requirements for premium features
  const features: FeatureModule[] = [
    {
      id: 'weather',
      icon: CloudSun,
      title: t('features.weather', 'Weather Hub'),
      description: t('features.weatherDesc', 'Hyperlocal weather forecasts & farming alerts'),
      route: '/weather',
      gradient: 'from-yellow-400/20 via-orange-500/10 to-red-500/20',
      tenantFeature: 'weather_forecast',
      usageCount: 5,
      // Basic feature - no profile required
    },
    {
      id: 'marketplace',
      icon: ShoppingCart,
      title: t('features.marketplace', 'Marketplace'),
      description: t('features.marketplaceDesc', 'Buy inputs & sell produce directly'),
      route: '/market',
      gradient: 'from-orange-400/20 via-red-500/10 to-pink-500/20',
      tenantFeature: 'marketplace',
      usageCount: 15,
      // Basic feature - no profile required
    },
    {
      id: 'my-lands',
      icon: MapPin,
      title: t('features.myLands', 'My Lands'),
      description: t('features.myLandsDesc', 'Manage your agricultural fields with GPS mapping'),
      route: '/my-lands',
      gradient: 'from-emerald-400/20 via-green-500/10 to-teal-500/20',
      requiresProfile: true,
      usageCount: 12,
      popularRank: 1,
      isPremium: true
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
      isNew: true,
      isPremium: true
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
      popularRank: 3,
      isPremium: true
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
      usageCount: 6,
      isPremium: true
    },
    {
      id: 'satellite',
      icon: Satellite,
      title: t('features.satellite', 'Satellite Intel'),
      description: t('features.satelliteDesc', 'NDVI analysis & crop health monitoring'),
      route: '/satellite-monitoring',
      gradient: 'from-indigo-400/20 via-purple-500/10 to-pink-500/20',
      tenantFeature: 'satellite_imagery',
      requiresProfile: true,
      isPremium: true,
      usageCount: 3
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
      // Basic feature - no profile required
    }
  ];

  const isFeatureEnabled = (feature: FeatureModule): boolean => {
    if (!feature.tenantFeature) return true;
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
    
    // Navigate to feature
    navigate(feature.route);
  };

  const handleProfileComplete = () => {
    refreshProfileStatus();
  };

  const isFeatureLocked = (feature: FeatureModule): boolean => {
    return feature.requiresProfile && !isProfileComplete;
  };

  // Separate features into basic and premium
  const basicFeatures = availableFeatures.filter(f => !f.requiresProfile);
  const premiumFeatures = availableFeatures.filter(f => f.requiresProfile);
  const unlockedPremiumFeatures = premiumFeatures.filter(f => isProfileComplete);

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

      {/* Basic Features (Always Available) */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-gray-800 flex items-center">
          Free Features
          <Badge className="ml-2 text-xs bg-green-100 text-green-700 border-green-200">
            {basicFeatures.length} available
          </Badge>
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {basicFeatures.map((feature, index) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              isLocked={false}
              onClick={() => handleFeatureClick(feature)}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* Premium Features */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-gray-800 flex items-center">
          Premium Features
          <Badge className="ml-2 text-xs bg-orange-100 text-orange-700 border-orange-200">
            {unlockedPremiumFeatures.length}/{premiumFeatures.length} unlocked
          </Badge>
        </h3>
        
        {!isProfileComplete && (
          <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-orange-800">Unlock Premium Features</h4>
                <p className="text-xs text-orange-600 mt-1">Complete your profile to access advanced farming tools</p>
              </div>
              <button
                onClick={() => setShowProfileModal(true)}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium rounded-lg transition-colors"
              >
                Complete Profile
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {premiumFeatures.map((feature, index) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              isLocked={isFeatureLocked(feature)}
              onClick={() => handleFeatureClick(feature)}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <Card className="bg-gradient-to-r from-green-50/50 via-blue-50/50 to-purple-50/50 border-green-100">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {basicFeatures.length + unlockedPremiumFeatures.length}
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
                {premiumFeatures.length - unlockedPremiumFeatures.length}
              </div>
              <div className="text-xs text-gray-600">Locked</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ModernProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onComplete={handleProfileComplete}
        featureName={selectedFeature}
      />
    </div>
  );
};
