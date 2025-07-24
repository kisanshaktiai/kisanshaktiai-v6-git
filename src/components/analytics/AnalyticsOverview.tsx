import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { 
  MapPin, 
  Sprout, 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Droplets,
  Thermometer,
  Calendar,
  Target
} from 'lucide-react';

interface OverviewData {
  totalLandArea: number;
  activeCrops: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  profitMargin: number;
  lastYield: number;
  weatherAlerts: number;
  soilHealthScore: number;
}

export const AnalyticsOverview: React.FC = () => {
  const { t } = useTranslation();
  const { profile } = useSelector((state: RootState) => state.farmer);
  const [overviewData, setOverviewData] = useState<OverviewData>({
    totalLandArea: 0,
    activeCrops: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    profitMargin: 0,
    lastYield: 0,
    weatherAlerts: 0,
    soilHealthScore: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      fetchOverviewData();
    }
  }, [profile?.id]);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      
      // Fetch lands data
      const { data: lands } = await supabase
        .from('lands')
        .select('id, area_acres, current_crop')
        .eq('farmer_id', profile?.id);

      // Fetch recent financial transactions (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: transactions } = await supabase
        .from('financial_transactions')
        .select('transaction_type, amount')
        .eq('farmer_id', profile?.id)
        .gte('transaction_date', thirtyDaysAgo.toISOString().split('T')[0]);

      // Fetch recent crop history for yield data
      const { data: cropHistory } = await supabase
        .from('crop_history')
        .select('yield_kg_per_acre')
        .eq('land_id', lands?.[0]?.id)
        .order('harvest_date', { ascending: false })
        .limit(1);

      // Calculate overview metrics
      const totalArea = lands?.reduce((sum, land) => sum + (land.area_acres || 0), 0) || 0;
      const activeCropsSet = new Set(lands?.map(land => land.current_crop).filter(Boolean));
      
      const revenue = transactions?.filter(t => t.transaction_type === 'income')
        .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      
      const expenses = transactions?.filter(t => t.transaction_type === 'expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      
      const profitMargin = revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0;

      setOverviewData({
        totalLandArea: totalArea,
        activeCrops: activeCropsSet.size,
        monthlyRevenue: revenue,
        monthlyExpenses: expenses,
        profitMargin,
        lastYield: cropHistory?.[0]?.yield_kg_per_acre || 0,
        weatherAlerts: 2, // Placeholder - would come from weather service
        soilHealthScore: 85 // Placeholder - would be calculated from soil_health table
      });
    } catch (error) {
      console.error('Error fetching overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const summaryCards = [
    {
      title: t('analytics.totalLand', 'Total Land'),
      value: `${overviewData.totalLandArea} ${t('common.acres', 'acres')}`,
      icon: MapPin,
      trend: null,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100'
    },
    {
      title: t('analytics.activeCrops', 'Active Crops'),
      value: overviewData.activeCrops.toString(),
      icon: Sprout,
      trend: null,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: t('analytics.monthlyRevenue', 'Monthly Revenue'),
      value: formatCurrency(overviewData.monthlyRevenue),
      icon: DollarSign,
      trend: overviewData.monthlyRevenue > 0 ? 'up' : null,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: t('analytics.profitMargin', 'Profit Margin'),
      value: `${overviewData.profitMargin.toFixed(1)}%`,
      icon: TrendingUp,
      trend: overviewData.profitMargin > 15 ? 'up' : overviewData.profitMargin < 5 ? 'down' : null,
      color: overviewData.profitMargin > 15 ? 'text-green-600' : overviewData.profitMargin < 5 ? 'text-red-600' : 'text-yellow-600',
      bgColor: overviewData.profitMargin > 15 ? 'bg-green-100' : overviewData.profitMargin < 5 ? 'bg-red-100' : 'bg-yellow-100'
    }
  ];

  const alerts = [
    {
      type: 'weather',
      message: t('analytics.weatherAlert', 'Heavy rain expected in 2 days'),
      action: t('analytics.checkWeather', 'Check Weather'),
      severity: 'warning'
    },
    {
      type: 'market',
      message: t('analytics.priceAlert', 'Wheat prices up 12% this week'),
      action: t('analytics.viewPrices', 'View Prices'),
      severity: 'info'
    }
  ];

  const quickActions = [
    {
      label: t('analytics.addExpense', 'Add Expense'),
      icon: DollarSign,
      action: () => {/* Navigate to expense form */}
    },
    {
      label: t('analytics.recordYield', 'Record Yield'),
      icon: Target,
      action: () => {/* Navigate to yield form */}
    },
    {
      label: t('analytics.checkSoil', 'Soil Test'),
      icon: Droplets,
      action: () => {/* Navigate to soil test */}
    },
    {
      label: t('analytics.viewCalendar', 'Crop Calendar'),
      icon: Calendar,
      action: () => {/* Navigate to calendar */}
    }
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {card.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {card.value}
                    </p>
                  </div>
                  <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                </div>
                {card.trend && (
                  <div className="flex items-center mt-3">
                    {card.trend === 'up' ? (
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm ${card.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {card.trend === 'up' ? t('analytics.trending', 'Trending up') : t('analytics.declining', 'Declining')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Alerts and Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <span>{t('analytics.alertsRecommendations', 'Alerts & Recommendations')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {alerts.map((alert, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{alert.message}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={alert.severity === 'warning' ? 'destructive' : 'default'}>
                  {alert.severity === 'warning' ? t('analytics.warning', 'Warning') : t('analytics.info', 'Info')}
                </Badge>
                <Button size="sm" variant="outline">
                  {alert.action}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.quickActions', 'Quick Actions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="h-16 flex flex-col items-center justify-center space-y-1"
                  onClick={action.action}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{action.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Soil Health Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Droplets className="w-5 h-5 text-blue-500" />
            <span>{t('analytics.soilHealth', 'Soil Health Summary')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900">
                {overviewData.soilHealthScore}/100
              </p>
              <p className="text-sm text-gray-600">
                {t('analytics.overallScore', 'Overall Health Score')}
              </p>
            </div>
            <div className="text-right">
              <Badge variant={overviewData.soilHealthScore > 80 ? 'default' : 'secondary'}>
                {overviewData.soilHealthScore > 80 ? t('analytics.healthy', 'Healthy') : t('analytics.needsAttention', 'Needs Attention')}
              </Badge>
              <p className="text-xs text-gray-500 mt-1">
                {t('analytics.lastTested', 'Last tested 15 days ago')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};