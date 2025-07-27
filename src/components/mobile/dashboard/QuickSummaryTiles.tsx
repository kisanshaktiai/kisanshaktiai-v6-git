
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOptimizedDashboard } from '@/hooks/useOptimizedDashboard';
import { 
  TrendingUp, 
  TrendingDown, 
  MapPin, 
  Sprout, 
  IndianRupee,
  Target,
  Activity,
  BarChart3,
  Loader2
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<any>;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  gradient: string;
  delay: number;
  isLoading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendValue, 
  gradient,
  delay,
  isLoading = false 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-3 h-3 text-green-600" />;
    if (trend === 'down') return <TrendingDown className="w-3 h-3 text-red-600" />;
    return <Activity className="w-3 h-3 text-gray-500" />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600 bg-green-50 border-green-200';
    if (trend === 'down') return 'text-red-600 bg-red-50 border-red-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  return (
    <Card className={`
      relative overflow-hidden transition-all duration-700 hover:shadow-2xl group
      border-0 shadow-lg backdrop-blur-sm hover:scale-[1.02] active:scale-[0.98]
      ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
    `}>
      <CardContent className="p-5">
        {/* Background Gradient */}
        <div className={`absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-300 ${gradient}`}></div>
        
        {/* Floating Elements */}
        <div className="absolute -top-2 -right-2 w-16 h-16 bg-white/5 rounded-full blur-xl"></div>
        <div className="absolute -bottom-1 -left-1 w-8 h-8 bg-white/10 rounded-full blur-lg"></div>

        <div className="relative z-10 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className={`
              w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg
              border border-white/30 backdrop-blur-sm transition-transform duration-300
              group-hover:scale-110 group-hover:rotate-3 ${gradient}
            `}>
              {isLoading ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : (
                <Icon className="w-6 h-6 text-white drop-shadow-lg" />
              )}
            </div>

            {trend && trendValue && (
              <Badge className={`text-xs font-medium border ${getTrendColor()}`}>
                <div className="flex items-center space-x-1">
                  {getTrendIcon()}
                  <span>{trendValue}</span>
                </div>
              </Badge>
            )}
          </div>

          {/* Content */}
          <div className="space-y-2">
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {title}
              </h3>
              {isLoading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse mt-1"></div>
              ) : (
                <div className="text-2xl font-bold text-foreground mt-1 font-mono">
                  {value}
                </div>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground leading-relaxed">
              {subtitle}
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full ${gradient} transition-all duration-1000 ease-out`}
              style={{ width: isVisible ? '75%' : '0%' }}
            ></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const QuickSummaryTiles: React.FC = () => {
  const { t } = useTranslation('dashboard');
  const { data: dashboardData, isLoading, error } = useOptimizedDashboard();

  console.log('Dashboard data in QuickSummaryTiles:', dashboardData);
  console.log('Loading state:', isLoading);
  console.log('Error state:', error);

  // Format currency value
  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toString();
  };

  const metrics = [
    {
      title: t('quickOverview.totalLand'),
      value: isLoading ? '---' : `${dashboardData?.summary?.totalArea || '12.5'} ${t('quickOverview.acres')}`,
      subtitle: t('quickOverview.lastMonth'),
      icon: MapPin,
      trend: 'up' as const,
      trendValue: '+2.1%',
      gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      delay: 0,
      isLoading
    },
    {
      title: t('quickOverview.activeCrops'),
      value: isLoading ? '---' : `${dashboardData?.summary?.activeCrops || '8'} ${t('quickOverview.varieties')}`,
      subtitle: t('quickOverview.thisMonth'),
      icon: Sprout,
      trend: 'neutral' as const,
      trendValue: '±0%',
      gradient: 'bg-gradient-to-br from-green-500 to-lime-600',
      delay: 100,
      isLoading
    },
    {
      title: t('quickOverview.netIncome'),
      value: isLoading ? '---' : `₹${formatCurrency(dashboardData?.summary?.netProfit || 155000)}`,
      subtitle: t('quickOverview.lastMonth'),
      icon: IndianRupee,
      trend: 'up' as const,
      trendValue: '+12.3%',
      gradient: 'bg-gradient-to-br from-blue-500 to-cyan-600',
      delay: 200,
      isLoading
    },
    {
      title: t('quickOverview.efficiency'),
      value: isLoading ? '---' : `87%`,
      subtitle: t('quickOverview.thisYear'),
      icon: Target,
      trend: 'up' as const,
      trendValue: '+5.2%',
      gradient: 'bg-gradient-to-br from-purple-500 to-indigo-600',
      delay: 300,
      isLoading
    }
  ];

  if (error) {
    console.error('Dashboard error:', error);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">
            {t('quickOverview.title')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            {t('quickOverview.subtitle')}
          </p>
        </div>
        <Badge 
          variant="secondary" 
          className="bg-primary/10 text-primary border-primary/20 font-medium"
        >
          <BarChart3 className="w-3 h-3 mr-1" />
          {isLoading ? t('status.loading') : t('status.ready')}
        </Badge>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric, index) => (
          <MetricCard
            key={metric.title}
            title={metric.title}
            value={metric.value}
            subtitle={metric.subtitle}
            icon={metric.icon}
            trend={metric.trend}
            trendValue={metric.trendValue}
            gradient={metric.gradient}
            delay={metric.delay}
            isLoading={metric.isLoading}
          />
        ))}
      </div>

      {/* Additional Insights */}
      <Card className="bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 border-primary/20 shadow-lg backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {t('quickOverview.productivity')} Index
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {t('quickOverview.updated')} 2 {t('quickOverview.ago')}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">92</div>
              <div className="flex items-center text-xs text-green-600 font-medium">
                <TrendingUp className="w-3 h-3 mr-1" />
                +8 pts
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3 w-full h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000 ease-out rounded-full"
              style={{ width: '92%' }}
            ></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
