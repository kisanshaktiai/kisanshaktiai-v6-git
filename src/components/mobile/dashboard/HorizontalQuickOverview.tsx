
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, MapPin, Sprout, DollarSign, Activity } from 'lucide-react';

export const HorizontalQuickOverview: React.FC = () => {
  const { t } = useTranslation('dashboard');

  const overviewData = [
    {
      icon: MapPin,
      title: t('quickOverview.totalLand'),
      value: '12.5',
      unit: t('quickOverview.acres'),
      change: '+0.5',
      trend: 'up' as const,
      color: 'text-emerald-600'
    },
    {
      icon: Sprout,
      title: t('quickOverview.activeCrops'),
      value: '6',
      unit: t('quickOverview.varieties'),
      change: '+2',
      trend: 'up' as const,
      color: 'text-green-600'
    },
    {
      icon: DollarSign,
      title: t('quickOverview.netIncome'),
      value: '₹85K',
      unit: t('quickOverview.thisMonth'),
      change: '+12%',
      trend: 'up' as const,
      color: 'text-blue-600'
    },
    {
      icon: Activity,
      title: t('quickOverview.efficiency'),
      value: '87%',
      unit: t('quickOverview.productivity'),
      change: '+3%',
      trend: 'up' as const,
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="space-y-2">
      <div className="px-4">
        <h3 className="text-base font-semibold text-foreground">{t('quickOverview.title')}</h3>
        <p className="text-xs text-muted-foreground">{t('quickOverview.subtitle')}</p>
      </div>
      
      <div className="px-4">
        <div className="grid grid-cols-2 gap-2">
          {overviewData.map((item, index) => (
            <Card key={index} className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-colors">
              <CardContent className="p-2">
                <div className="flex items-center space-x-1 mb-1">
                  <div className={`p-1 rounded-md bg-muted/50`}>
                    <item.icon className={`w-3 h-3 ${item.color}`} />
                  </div>
                  <div className="flex items-center space-x-1">
                    {item.trend === 'up' ? (
                      <TrendingUp className="w-2 h-2 text-emerald-500" />
                    ) : (
                      <TrendingDown className="w-2 h-2 text-red-500" />
                    )}
                    <span className={`text-xs font-medium ${
                      item.trend === 'up' ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {item.change}
                    </span>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-lg font-bold text-foreground">{item.value}</span>
                    <span className="text-xs text-muted-foreground">{item.unit}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.title}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
