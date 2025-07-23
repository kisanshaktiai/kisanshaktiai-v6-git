
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, MapPin, Sprout, DollarSign } from 'lucide-react';
import { useStubData } from '@/hooks/useStubData';

export const AnalyticsOverview: React.FC = () => {
  const { t } = useTranslation();
  const { farmer } = useStubData();

  const overviewCards = [
    {
      title: t('analytics.totalLand', 'Total Land'),
      value: '25.5 acres',
      icon: MapPin,
      trend: '+2.1%',
      trendUp: true
    },
    {
      title: t('analytics.activeCrops', 'Active Crops'),
      value: '4',
      icon: Sprout,
      trend: '+1',
      trendUp: true
    },
    {
      title: t('analytics.monthlyIncome', 'Monthly Income'),
      value: '₹45,000',
      icon: DollarSign,
      trend: '+12.5%',
      trendUp: true
    },
    {
      title: t('analytics.yieldEfficiency', 'Yield Efficiency'),
      value: '87%',
      icon: TrendingUp,
      trend: '+5.2%',
      trendUp: true
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {card.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className={`text-xs ${card.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                  {card.trend} from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Farmer Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              <strong>Name:</strong> {farmer.name}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Location:</strong> {farmer.village}, {farmer.district}, {farmer.state}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Mobile:</strong> {farmer.mobile_number}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
