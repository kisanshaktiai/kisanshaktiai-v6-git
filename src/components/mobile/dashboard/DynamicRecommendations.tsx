
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  TrendingUp, 
  Calendar, 
  Beaker, 
  Tag,
  ArrowRight
} from 'lucide-react';

interface Recommendation {
  id: string;
  type: 'alert' | 'market' | 'task' | 'health' | 'promotion';
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionLabel?: string;
  actionRoute?: string;
}

export const DynamicRecommendations: React.FC = () => {
  const { t } = useTranslation();

  const recommendations: Recommendation[] = [
    {
      id: 'weather-alert',
      type: 'alert',
      icon: AlertTriangle,
      title: t('recommendations.weatherAlert', 'Heavy Rain Expected'),
      description: t('recommendations.weatherAlertDesc', 'Protect your crops from flooding. Check drainage systems.'),
      priority: 'high',
      actionLabel: t('common.viewDetails', 'View Details'),
      actionRoute: '/weather'
    },
    {
      id: 'market-trend',
      type: 'market',
      icon: TrendingUp,
      title: t('recommendations.marketTrend', 'Wheat Prices Rising'),
      description: t('recommendations.marketTrendDesc', 'Consider selling stored wheat. Prices up 15% this week.'),
      priority: 'medium',
      actionLabel: t('common.checkPrices', 'Check Prices'),
      actionRoute: '/marketplace'
    },
    {
      id: 'upcoming-task',
      type: 'task',
      icon: Calendar,
      title: t('recommendations.upcomingTask', 'Fertilizer Application Due'),
      description: t('recommendations.upcomingTaskDesc', 'Apply NPK fertilizer to Field 1 this week.'),
      priority: 'medium',
      actionLabel: t('common.addToSchedule', 'Add to Schedule'),
      actionRoute: '/crop-schedule'
    },
    {
      id: 'soil-health',
      type: 'health',
      icon: Beaker,
      title: t('recommendations.soilHealth', 'Soil Test Recommended'),
      description: t('recommendations.soilHealthDesc', 'Last test was 6 months ago. Check nutrient levels.'),
      priority: 'low',
      actionLabel: t('common.bookTest', 'Book Test'),
      actionRoute: '/soil-testing'
    },
    {
      id: 'promotion',
      type: 'promotion',
      icon: Tag,
      title: t('recommendations.promotion', 'Special Offer: Premium Seeds'),
      description: t('recommendations.promotionDesc', '20% off on hybrid seeds. Limited time offer.'),
      priority: 'low',
      actionLabel: t('common.shopNow', 'Shop Now'),
      actionRoute: '/marketplace'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'alert': return 'text-red-600';
      case 'market': return 'text-green-600';
      case 'task': return 'text-blue-600';
      case 'health': return 'text-purple-600';
      case 'promotion': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {t('dashboard.recommendations', 'Recommendations')}
        </h2>
        <Button variant="ghost" size="sm">
          {t('common.viewAll', 'View All')}
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
      
      <div className="space-y-3">
        {recommendations.slice(0, 3).map((rec) => {
          const Icon = rec.icon;
          return (
            <Card key={rec.id} className="border-l-4 border-l-primary">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <Icon className={`w-5 h-5 ${getIconColor(rec.type)}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {rec.title}
                      </h3>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getPriorityColor(rec.priority)}`}
                      >
                        {t(`priority.${rec.priority}`, rec.priority)}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {rec.description}
                    </p>
                    
                    {rec.actionLabel && (
                      <Button variant="outline" size="sm" className="text-xs">
                        {rec.actionLabel}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
