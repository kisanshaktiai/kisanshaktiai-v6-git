
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { ProfileCompletionModal } from '@/components/common/ProfileCompletionModal';
import { EnhancedFeatureCard } from './EnhancedFeatureCard';
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
  Sparkles,
  Filter,
  Grid3X3
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
  category: 'farming' | 'analytics' | 'community' | 'commerce';
}

export const ProfessionalFeatureGrid: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tenantFeatures } = useSelector((state: RootState) => state.tenant);
  const { isProfileComplete, refreshProfileStatus } = useProfileCompletion();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'farming' | 'analytics' | 'community' | 'commerce'>('all');

  const features: FeatureModule[] = [
    {
      id: 'my-lands',
      icon: MapPin,
      title: t('features.myLands', 'My Lands'),
      description: t('features.myLandsDesc', 'Manage agricultural fields with GPS mapping and crop tracking'),
      route: '/my-lands',
      gradient: 'from-emerald-400/20 via-green-500/10 to-teal-500/20',
      requiresProfile: true,
      usageCount: 12,
      popularRank: 1,
      category: 'farming'
    },
    {
      id: 'ai-chat',
      icon: MessageCircle,
      title: t('features.aiChat', 'AI Assistant'),
      description: t('features.aiChatDesc', 'Get personalized farming advice from AI agricultural expert'),
      route: '/ai-chat',
      gradient: 'from-blue-400/20 via-indigo-500/10 to-purple-500/20',
      tenantFeature: 'ai_chat',
      requiresProfile: true,
      usageCount: 28,
      popularRank: 2,
      isNew: true,
      category: 'farming'
    },
    {
      id: 'weather',
      icon: CloudSun,
      title: t('features.weather', 'Weather Hub'),
      description: t('features.weatherDesc', 'Hyperlocal forecasts with agricultural insights and alerts'),
      route: '/weather',
      gradient: 'from-yellow-400/20 via-orange-500/10 to-red-500/20',
      tenantFeature: 'weather_forecast',
      usageCount: 5,
      category: 'farming'
    },
    {
      id: 'crop-schedule',
      icon: Calendar,
      title: t('features.cropSchedule', 'Smart Calendar'),
      description: t('features.cropScheduleDesc', 'AI-powered crop planning with seasonal recommendations'),
      route: '/crop-schedule',
      gradient: 'from-green-400/20 via-lime-500/10 to-emerald-500/20',
      requiresProfile: true,
      usageCount: 8,
      popularRank: 3,
      category: 'farming'
    },
    {
      id: 'satellite',
      icon: Satellite,
      title: t('features.satellite', 'Satellite Intel'),
      description: t('features.satelliteDesc', 'NDVI analysis and precision crop health monitoring'),
      route: '/satellite',
      gradient: 'from-indigo-400/20 via-purple-500/10 to-pink-500/20',
      tenantFeature: 'satellite_imagery',
      requiresProfile: true,
      isPremium: true,
      usageCount: 3,
      category: 'analytics'
    },
    {
      id: 'analytics',
      icon: BarChart3,
      title: t('features.analytics', 'Farm Analytics'),
      description: t('features.analyticsDesc', 'Performance insights with predictive yield analysis'),
      route: '/analytics',
      gradient: 'from-purple-400/20 via-violet-500/10 to-indigo-500/20',
      tenantFeature: 'basic_analytics',
      requiresProfile: true,
      usageCount: 6,
      category: 'analytics'
    },
    {
      id: 'marketplace',
      icon: ShoppingCart,
      title: t('features.marketplace', 'Marketplace'),
      description: t('features.marketplaceDesc', 'Buy inputs and sell produce with price intelligence'),
      route: '/marketplace',
      gradient: 'from-orange-400/20 via-red-500/10 to-pink-500/20',
      tenantFeature: 'marketplace',
      requiresProfile: true,
      usageCount: 15,
      category: 'commerce'
    },
    {
      id: 'community',
      icon: Users,
      title: t('features.community', 'Farmer Network'),
      description: t('features.communityDesc', 'Connect with local farming community and experts'),
      route: '/community',
      gradient: 'from-pink-400/20 via-rose-500/10 to-red-500/20',
      tenantFeature: 'community_forum',
      usageCount: 22,
      category: 'community'
    },
    {
      id: 'reports',
      icon: FileText,
      title: t('features.reports', 'Smart Reports'),
      description: t('features.reportsDesc', 'Generate compliance docs and yield analytics reports'),
      route: '/reports',
      gradient: 'from-gray-400/20 via-slate-500/10 to-zinc-500/20',
      requiresProfile: true,
      usageCount: 4,
      category: 'analytics'
    },
    {
      id: 'schemes',
      icon: Shield,
      title: t('features.schemes', 'Govt Schemes'),
      description: t('features.schemesDesc', 'Access subsidies and agricultural insurance programs'),
      route: '/schemes',
      gradient: 'from-teal-400/20 via-cyan-500/10 to-blue-500/20',
      usageCount: 7,
      category: 'commerce'
    }
  ];

  const isFeatureEnabled = (feature: FeatureModule): boolean => {
    if (!feature.tenantFeature) return true;
    return tenantFeatures?.[feature.tenantFeature as keyof typeof tenantFeatures] ?? true;
  };

  const availableFeatures = features.filter(isFeatureEnabled);

  const filteredFeatures = activeCategory === 'all' 
    ? availableFeatures 
    : availableFeatures.filter(f => f.category === activeCategory);

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

  const getCategoryStats = (category: string) => {
    if (category === 'all') return availableFeatures.length;
    return availableFeatures.filter(f => f.category === category).length;
  };

  const categories = [
    { id: 'all', label: 'All Tools', icon: Grid3X3, count: getCategoryStats('all') },
    { id: 'farming', label: 'Farming', icon: MapPin, count: getCategoryStats('farming') },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, count: getCategoryStats('analytics') },
    { id: 'community', label: 'Community', icon: Users, count: getCategoryStats('community') },
    { id: 'commerce', label: 'Commerce', icon: ShoppingCart, count: getCategoryStats('commerce') }
  ];

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              {t('dashboard.features', 'Farm Tools')}
            </h2>
            <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {t('dashboard.featuresDesc', 'Professional tools for modern farming')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge 
            variant="secondary" 
            className="bg-gradient-to-r from-green-50 to-blue-50 text-green-700 border-green-200 font-medium shadow-sm"
          >
            <Filter className="w-3 h-3 mr-1" />
            {filteredFeatures.length}
          </Badge>
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as any)}>
        <TabsList className="grid w-full grid-cols-5 bg-gray-100/80 backdrop-blur-sm p-1 h-auto">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <TabsTrigger 
                key={category.id} 
                value={category.id} 
                className="flex flex-col items-center space-y-1 py-2 data-[state=active]:bg-white data-[state=active]:shadow-md"
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs font-medium">{category.label}</span>
                <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                  {category.count}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-6">
          {/* Feature Grid */}
          <div className="grid grid-cols-2 gap-4">
            {filteredFeatures.map((feature, index) => (
              <EnhancedFeatureCard
                key={feature.id}
                feature={feature}
                isLocked={isFeatureLocked(feature)}
                onClick={() => handleFeatureClick(feature)}
                index={index}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Enhanced Quick Stats */}
      <Card className="bg-gradient-to-r from-green-50/50 via-blue-50/50 to-purple-50/50 border-green-100 shadow-lg">
        <CardContent className="p-4">
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {availableFeatures.filter(f => !isFeatureLocked(f)).length}
              </div>
              <div className="text-xs text-gray-600 font-medium">Available</div>
            </div>
            <div>
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {availableFeatures.reduce((sum, f) => sum + (f.usageCount || 0), 0)}
              </div>
              <div className="text-xs text-gray-600 font-medium">Uses</div>
            </div>
            <div>
              <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                {availableFeatures.filter(f => f.isNew || f.isPremium).length}
              </div>
              <div className="text-xs text-gray-600 font-medium">Premium</div>
            </div>
            <div>
              <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                {availableFeatures.filter(f => f.popularRank && f.popularRank <= 3).length}
              </div>
              <div className="text-xs text-gray-600 font-medium">Popular</div>
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
