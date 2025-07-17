import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  MapPin, 
  Clock,
  Eye
} from 'lucide-react';

export const TrendingArea: React.FC = () => {
  const trendingCrops = [
    {
      id: 1,
      crop: 'Tomatoes',
      currentPrice: 3200,
      previousPrice: 2800,
      trend: 'up',
      change: 14.3,
      demandLevel: 'High',
      activeListings: 23,
      averageSellTime: '2 days'
    },
    {
      id: 2,
      crop: 'Onions',
      currentPrice: 2400,
      previousPrice: 2600,
      trend: 'down',
      change: -7.7,
      demandLevel: 'Medium',
      activeListings: 18,
      averageSellTime: '4 days'
    },
    {
      id: 3,
      crop: 'Wheat',
      currentPrice: 2150,
      previousPrice: 2100,
      trend: 'up',
      change: 2.4,
      demandLevel: 'High',
      activeListings: 34,
      averageSellTime: '1 day'
    }
  ];

  const getTrendIcon = (trend: string) => {
    return trend === 'up' ? 
      <TrendingUp className="w-4 h-4 text-green-600" /> : 
      <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const getTrendColor = (trend: string) => {
    return trend === 'up' ? 'text-green-600' : 'text-red-600';
  };

  const getDemandColor = (level: string) => {
    switch (level) {
      case 'High': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Trending in Your Area</h2>
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 mr-1" />
          Within 25km
        </div>
      </div>

      <div className="space-y-4">
        {trendingCrops.map((crop) => (
          <Card key={crop.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-lg">{crop.crop}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-2xl font-bold text-primary">
                      ₹{crop.currentPrice.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">/quintal</span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-1 mb-1">
                    {getTrendIcon(crop.trend)}
                    <span className={`text-sm font-medium ${getTrendColor(crop.trend)}`}>
                      {crop.change > 0 ? '+' : ''}{crop.change}%
                    </span>
                  </div>
                  <Badge className={getDemandColor(crop.demandLevel)}>
                    {crop.demandLevel} Demand
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="flex items-center justify-center mb-1">
                    <Eye className="w-4 h-4 text-muted-foreground mr-1" />
                    <span className="text-sm font-medium">{crop.activeListings}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Active Listings</div>
                </div>
                
                <div>
                  <div className="flex items-center justify-center mb-1">
                    <Clock className="w-4 h-4 text-muted-foreground mr-1" />
                    <span className="text-sm font-medium">{crop.averageSellTime}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Avg. Sell Time</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    ₹{crop.previousPrice.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Previous Week</div>
                </div>
              </div>

              {crop.demandLevel === 'High' && (
                <div className="mt-3 p-2 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs text-green-800 text-center">
                    🔥 High demand! Great time to list your {crop.crop.toLowerCase()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-4 bg-blue-50 border-blue-200">
        <CardContent className="p-4 text-center">
          <h4 className="font-medium text-blue-900 mb-2">💡 Market Insight</h4>
          <p className="text-sm text-blue-800">
            Vegetable prices are up 12% this week due to seasonal demand. 
            Consider listing your produce now for better returns.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};