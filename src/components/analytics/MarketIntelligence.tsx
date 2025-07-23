
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, BarChart3, MapPin, Calendar } from 'lucide-react';
import { useStubData } from '@/hooks/useStubData';

export const MarketIntelligence: React.FC = () => {
  const { t } = useTranslation();
  const { farmer } = useStubData();

  const marketData = [
    {
      crop: 'Rice',
      currentPrice: '₹2,150/quintal',
      trend: '+5.2%',
      trendUp: true,
      demand: 'High'
    },
    {
      crop: 'Wheat',
      currentPrice: '₹2,450/quintal',
      trend: '-2.1%',
      trendUp: false,
      demand: 'Medium'
    },
    {
      crop: 'Cotton',
      currentPrice: '₹5,800/quintal',
      trend: '+8.7%',
      trendUp: true,
      demand: 'High'
    }
  ];

  const nearbyMarkets = [
    { name: 'Main Market', distance: '5 km', timing: '6 AM - 2 PM' },
    { name: 'Weekly Haat', distance: '12 km', timing: 'Every Tuesday' },
    { name: 'APMC Yard', distance: '18 km', timing: '7 AM - 5 PM' }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Market Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Market insights for {farmer.name} in {farmer.district}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Market Prices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {marketData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{item.crop}</h4>
                  <p className="text-sm text-gray-600">Demand: {item.demand}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{item.currentPrice}</p>
                  <p className={`text-sm ${item.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                    {item.trend}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Nearby Markets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {nearbyMarkets.map((market, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{market.name}</h4>
                  <p className="text-sm text-gray-600">{market.distance} away</p>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-1" />
                  {market.timing}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
