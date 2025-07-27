
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle,
  TrendingUp, 
  Sprout, 
  TestTube,
  Shield,
  Droplets,
  Calendar,
  ChevronRight,
  Clock,
  MapPin,
  Star,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  Zap
} from 'lucide-react';

interface Recommendation {
  id: string;
  category: 'weather' | 'market' | 'crop' | 'soil' | 'pest' | 'irrigation' | 'fertilizer';
  priority: 'high' | 'medium' | 'low' | 'urgent';
  title: string;
  description: string;
  actionText: string;
  timeframe: string;
  location?: string;
  impact: 'high' | 'medium' | 'low';
  isNew?: boolean;
}

const RecommendationCard: React.FC<{ 
  recommendation: Recommendation; 
  onAction: (id: string) => void;
  onDismiss: (id: string) => void;
  index: number;
}> = ({ recommendation, onAction, onDismiss, index }) => {
  const { t } = useTranslation('dashboard');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  const getCategoryIcon = () => {
    const icons = {
      weather: AlertTriangle,
      market: TrendingUp,
      crop: Sprout,
      soil: TestTube,
      pest: Shield,
      irrigation: Droplets,
      fertilizer: Zap
    };
    const Icon = icons[recommendation.category] || Info;
    return <Icon className="w-5 h-5" />;
  };

  const getCategoryColor = () => {
    const colors = {
      weather: 'from-orange-500 to-red-500',
      market: 'from-green-500 to-emerald-500',
      crop: 'from-lime-500 to-green-500',
      soil: 'from-amber-500 to-orange-500',
      pest: 'from-red-500 to-pink-500',
      irrigation: 'from-blue-500 to-cyan-500',
      fertilizer: 'from-purple-500 to-indigo-500'
    };
    return colors[recommendation.category] || 'from-gray-500 to-slate-500';
  };

  const getPriorityColor = () => {
    const colors = {
      urgent: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[recommendation.priority];
  };

  const getPriorityIcon = () => {
    const icons = {
      urgent: AlertCircle,
      high: AlertTriangle,
      medium: Clock,
      low: Info
    };
    const Icon = icons[recommendation.priority];
    return <Icon className="w-3 h-3" />;
  };

  return (
    <Card className={`
      relative overflow-hidden transition-all duration-500 group hover:shadow-xl
      border-0 shadow-lg backdrop-blur-sm hover:scale-[1.02] active:scale-[0.98]
      ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}
    `}>
      <CardContent className="p-5">
        {/* Background Elements */}
        <div className={`absolute inset-0 bg-gradient-to-br ${getCategoryColor()} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
        <div className="absolute -top-3 -right-3 w-20 h-20 bg-white/5 rounded-full blur-xl"></div>

        {/* Dismiss Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDismiss(recommendation.id)}
          className="absolute top-2 right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-100 hover:text-red-600"
        >
          <X className="w-3 h-3" />
        </Button>

        <div className="relative z-10 space-y-4">
          {/* Header */}
          <div className="flex items-start space-x-3">
            <div className={`
              w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg
              bg-gradient-to-br ${getCategoryColor()} text-white
              transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3
            `}>
              {getCategoryIcon()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <Badge className={`text-xs font-medium border ${getPriorityColor()}`}>
                  <div className="flex items-center space-x-1">
                    {getPriorityIcon()}
                    <span>{t(`recommendations.priority.${recommendation.priority}`)}</span>
                  </div>
                </Badge>
                {recommendation.isNew && (
                  <Badge className="text-xs bg-primary text-primary-foreground animate-pulse">
                    <Star className="w-3 h-3 mr-1" />
                    {t('features.new')}
                  </Badge>
                )}
              </div>

              <h3 className="text-sm font-semibold text-foreground leading-tight">
                {recommendation.title}
              </h3>
              
              <div className="flex items-center text-xs text-muted-foreground mt-1 space-x-3">
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{recommendation.timeframe}</span>
                </div>
                {recommendation.location && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span>{recommendation.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed pl-15">
            {recommendation.description}
          </p>

          {/* Action */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center space-x-2">
              <Badge 
                variant="secondary" 
                className={`text-xs ${
                  recommendation.impact === 'high' ? 'bg-green-100 text-green-700 border-green-200' :
                  recommendation.impact === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                  'bg-gray-100 text-gray-700 border-gray-200'
                }`}
              >
                {recommendation.impact === 'high' ? '🎯' : recommendation.impact === 'medium' ? '📈' : '📊'} 
                {t(`recommendations.impact.${recommendation.impact}`, recommendation.impact)} Impact
              </Badge>
            </div>

            <Button 
              onClick={() => onAction(recommendation.id)}
              size="sm"
              className="h-8 px-3 text-xs font-medium bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 transition-all duration-200"
            >
              {recommendation.actionText}
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const DynamicRecommendations: React.FC = () => {
  const { t } = useTranslation('dashboard');
  const [recommendations] = useState<Recommendation[]>([
    {
      id: '1',
      category: 'weather',
      priority: 'urgent',
      title: t('recommendations.weatherAlert'),
      description: t('recommendations.weatherAlertDesc'),
      actionText: t('recommendations.actions.viewDetails'),
      timeframe: '2 hours',
      location: 'Field 1',
      impact: 'high',
      isNew: true
    },
    {
      id: '2',
      category: 'market',
      priority: 'high',
      title: t('recommendations.marketTrend'),
      description: t('recommendations.marketTrendDesc'),
      actionText: t('recommendations.actions.checkPrices'),
      timeframe: 'This week',
      impact: 'high'
    },
    {
      id: '3',
      category: 'fertilizer',
      priority: 'medium',
      title: t('recommendations.upcomingTask'),
      description: t('recommendations.upcomingTaskDesc'),
      actionText: t('recommendations.actions.schedule'),
      timeframe: '3 days',
      location: 'Field 2',
      impact: 'medium'
    }
  ]);

  const [displayedRecommendations, setDisplayedRecommendations] = useState(recommendations);

  const handleAction = (id: string) => {
    console.log('Action clicked for recommendation:', id);
    // Handle recommendation action
  };

  const handleDismiss = (id: string) => {
    setDisplayedRecommendations(prev => prev.filter(rec => rec.id !== id));
  };

  if (displayedRecommendations.length === 0) {
    return (
      <Card className="bg-gradient-to-r from-green-50/50 via-blue-50/50 to-purple-50/50 border-green-100">
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {t('recommendations.empty.title')}
          </h3>
          <p className="text-muted-foreground">
            {t('recommendations.empty.subtitle')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">
            {t('recommendations.title')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            {t('recommendations.subtitle')}
          </p>
        </div>
        <Badge 
          variant="secondary" 
          className="bg-orange-100 text-orange-700 border-orange-200 font-medium"
        >
          {displayedRecommendations.length} {t('dashboard.notifications.new', 'active')}
        </Badge>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {displayedRecommendations.map((recommendation, index) => (
          <RecommendationCard
            key={recommendation.id}
            recommendation={recommendation}
            onAction={handleAction}
            onDismiss={handleDismiss}
            index={index}
          />
        ))}
      </div>

      {/* View All Button */}
      <Button 
        variant="outline" 
        className="w-full h-12 rounded-2xl border-2 border-dashed border-primary/30 text-primary hover:bg-primary/5 transition-all duration-200"
      >
        {t('recommendations.actions.viewAll', 'View All Recommendations')}
        <ChevronRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
};
