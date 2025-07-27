
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Lock, 
  Sparkles, 
  Zap, 
  Star, 
  Crown,
  TrendingUp,
  Activity
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
  category?: 'farming' | 'analytics' | 'community' | 'commerce';
}

interface EnhancedFeatureCardProps {
  feature: FeatureModule;
  isLocked: boolean;
  onClick: () => void;
  index: number;
}

const categoryColors = {
  farming: 'from-green-500/20 via-emerald-400/15 to-teal-500/20',
  analytics: 'from-purple-500/20 via-violet-400/15 to-indigo-500/20',
  community: 'from-pink-500/20 via-rose-400/15 to-red-500/20',
  commerce: 'from-orange-500/20 via-amber-400/15 to-yellow-500/20'
};

const categoryAccents = {
  farming: 'bg-gradient-to-r from-green-500 to-emerald-500',
  analytics: 'bg-gradient-to-r from-purple-500 to-violet-500',
  community: 'bg-gradient-to-r from-pink-500 to-rose-500',
  commerce: 'bg-gradient-to-r from-orange-500 to-amber-500'
};

export const EnhancedFeatureCard: React.FC<EnhancedFeatureCardProps> = ({ 
  feature, 
  isLocked, 
  onClick, 
  index 
}) => {
  const Icon = feature.icon;
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const categoryGradient = categoryColors[feature.category || 'farming'];
  const categoryAccent = categoryAccents[feature.category || 'farming'];

  return (
    <Card 
      className={`
        relative cursor-pointer transition-all duration-500 hover:shadow-2xl active:scale-95 
        border-0 shadow-lg backdrop-blur-sm overflow-hidden group animate-fade-in
        ${feature.isComingSoon ? 'opacity-75' : ''} 
        ${isLocked ? 'opacity-80' : 'hover:scale-105 hover:-translate-y-1'}
        ${isPressed ? 'scale-95' : ''}
      `}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      style={{ 
        animationDelay: `${index * 80}ms`,
        background: `linear-gradient(135deg, white 0%, ${categoryGradient.split(' ').slice(1).join(' ')})`
      }}
    >
      <CardContent className="p-5 relative">
        {/* Category Accent Line */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${categoryAccent} opacity-60`}></div>
        
        {/* Background Effects */}
        <div className={`absolute inset-0 bg-gradient-to-br ${categoryGradient} opacity-${isHovered ? '40' : '25'} transition-opacity duration-500`}></div>
        
        {/* Floating Elements */}
        <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-xl animate-float"></div>
        <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-white/5 rounded-full blur-lg animate-float" style={{ animationDelay: '2s' }}></div>

        {/* Status Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-1">
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
          <div className="absolute top-3 left-3 bg-orange-100 border border-orange-200 rounded-full p-2 shadow-md">
            <Lock className="w-3.5 h-3.5 text-orange-600" />
          </div>
        )}
        
        {/* Main Content */}
        <div className="relative z-10 space-y-4">
          {/* Icon Container with Enhanced Design */}
          <div className="relative">
            <div className={`
              w-16 h-16 rounded-2xl flex items-center justify-center 
              shadow-xl border border-white/40 backdrop-blur-sm
              transition-all duration-500 ${isHovered ? 'scale-110 rotate-3 shadow-2xl' : ''}
              ${isLocked ? 'opacity-70' : ''}
            `}
            style={{ 
              background: `linear-gradient(135deg, ${categoryAccent.replace('bg-gradient-to-r', '').split(' ').slice(1, 3).join(' ')})` 
            }}>
              <Icon className="w-8 h-8 text-white drop-shadow-lg" />
            </div>
            
            {/* Enhanced Glow Effect */}
            {isHovered && !isLocked && (
              <div 
                className="absolute inset-0 w-16 h-16 rounded-2xl blur-lg opacity-70 animate-pulse"
                style={{ background: `linear-gradient(135deg, ${categoryAccent.replace('bg-gradient-to-r', '').split(' ').slice(1, 3).join(' ')})` }}
              ></div>
            )}

            {/* Usage Activity Indicator */}
            {feature.usageCount && feature.usageCount > 0 && !isLocked && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full flex items-center justify-center shadow-lg">
                <span className="text-xs text-white font-bold">{feature.usageCount > 99 ? '99+' : feature.usageCount}</span>
              </div>
            )}

            {/* Trending Indicator */}
            {feature.popularRank && feature.popularRank === 1 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-bounce">
                <TrendingUp className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          
          {/* Enhanced Text Content */}
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <h3 className="font-bold text-gray-900 text-sm leading-tight pr-2">
                {feature.title}
              </h3>
              {!isLocked && !feature.isComingSoon && (
                <div className="flex items-center space-x-1">
                  <Activity className="w-3 h-3 text-green-500 opacity-60" />
                  <Zap className="w-3 h-3 text-yellow-500 opacity-60" />
                </div>
              )}
            </div>
            
            <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
              {isLocked ? 'Complete your profile to unlock this feature' : feature.description}
            </p>

            {/* Enhanced Action Area */}
            {!feature.isComingSoon && !isLocked && (
              <div className="flex items-center justify-between pt-3 border-t border-gray-100/50">
                <span className="text-xs text-gray-500 font-medium">Tap to explore</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                  <div className="w-1.5 h-1.5 bg-gradient-to-r from-green-500 to-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                </div>
              </div>
            )}
            
            {feature.isComingSoon && (
              <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600 border-gray-200 font-medium shadow-sm">
                <Star className="w-3 h-3 mr-1" />
                Coming Soon
              </Badge>
            )}
          </div>

          {/* Micro-interactions */}
          {isHovered && !isLocked && (
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-lg pointer-events-none"></div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
