import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  MapPin, 
  Clock, 
  TrendingUp,
  Package,
  Zap
} from 'lucide-react';

export const PersonalizedRecommendations: React.FC = () => {
  const recommendations = [
    {
      id: 1,
      type: 'seasonal',
      title: 'Perfect timing for Kharif seeds',
      description: 'Based on your location and weather patterns, now is ideal for cotton and soybean seeds.',
      products: ['Cotton Seeds BT', 'Soybean JS-335', 'Maize Hybrid'],
      urgency: 'high',
      savings: '15% off',
      validUntil: '2024-04-15'
    },
    {
      id: 2,
      type: 'crop-based',
      title: 'Recommended for your wheat fields',
      description: 'Products specifically selected for wheat cultivation in your area.',
      products: ['NPK Fertilizer', 'Fungicide Spray', 'Growth Enhancer'],
      urgency: 'medium',
      savings: '₹500 off',
      validUntil: '2024-04-20'
    },
    {
      id: 3,
      type: 'weather',
      title: 'Monsoon preparation essentials',
      description: 'Weather forecast shows early monsoon. Get ready with these products.',
      products: ['Drainage Tools', 'Fungicide', 'Mulch Film'],
      urgency: 'medium',
      savings: 'Free delivery',
      validUntil: '2024-04-25'
    }
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'seasonal': return <Clock className="w-4 h-4" />;
      case 'crop-based': return <Package className="w-4 h-4" />;
      case 'weather': return <Zap className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div>
      <div className="flex items-center space-x-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Recommended for You</h2>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec) => (
          <Card key={rec.id} className="overflow-hidden border-l-4 border-l-primary">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getIcon(rec.type)}
                  <h3 className="font-medium text-sm">{rec.title}</h3>
                </div>
                <Badge className={getUrgencyColor(rec.urgency)}>
                  {rec.urgency} priority
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground mb-3">
                {rec.description}
              </p>

              <div className="mb-3">
                <div className="flex flex-wrap gap-1 mb-2">
                  {rec.products.map((product, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {product}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <div className="flex items-center text-green-600">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {rec.savings}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    Valid until {new Date(rec.validUntil).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="text-xs">
                    View Details
                  </Button>
                  <Button size="sm" className="text-xs">
                    Shop Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Location-based suggestion */}
      <Card className="mt-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 mb-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <h4 className="font-medium text-blue-900">Popular in Your Area</h4>
          </div>
          <p className="text-sm text-blue-800 mb-3">
            Farmers near you are buying: <strong>Drip Irrigation Systems</strong> and <strong>Organic Fertilizers</strong>
          </p>
          <Button size="sm" variant="outline" className="text-xs">
            See What's Trending Locally
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};