
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const Market: React.FC = () => {
  const { t } = useTranslation();

  const mockPrices = [
    {
      id: 1,
      crop: 'Wheat',
      currentPrice: 2150,
      previousPrice: 2100,
      unit: t('market.perQuintal'),
      trend: 'up',
      change: 2.4,
    },
    {
      id: 2,
      crop: 'Rice',
      currentPrice: 3200,
      previousPrice: 3300,
      unit: t('market.perQuintal'),
      trend: 'down',
      change: -3.0,
    },
    {
      id: 3,
      crop: 'Corn',
      currentPrice: 1850,
      previousPrice: 1850,
      unit: t('market.perQuintal'),
      trend: 'stable',
      change: 0,
    },
    {
      id: 4,
      crop: 'Sugarcane',
      currentPrice: 350,
      previousPrice: 340,
      unit: t('market.perTon'),
      trend: 'up',
      change: 2.9,
    },
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t('market.title')}
        </h1>
        <p className="text-gray-600">{t('market.subtitle')}</p>
        <Badge variant="outline" className="mt-2">
          {t('market.updatedAgo')}
        </Badge>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">{t('market.todaysPrices')}</h2>
        {mockPrices.map((price) => (
          <Card key={price.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{price.crop}</CardTitle>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(price.trend)}
                  <span className={`text-sm font-medium ${getTrendColor(price.trend)}`}>
                    {price.change > 0 ? '+' : ''}{price.change}%
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    ₹{price.currentPrice.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">{price.unit}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">{t('market.previous')}</div>
                  <div className="text-lg font-medium text-gray-500">
                    ₹{price.previousPrice.toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-blue-50">
        <CardContent className="p-4 text-center">
          <h3 className="font-semibold text-blue-900 mb-2">{t('market.marketTip')}</h3>
          <p className="text-sm text-blue-800">
            {t('market.marketTipContent')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
