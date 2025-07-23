
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sprout, TrendingUp, Calendar, Target } from 'lucide-react';
import { useStubData } from '@/hooks/useStubData';

export const CropPerformance: React.FC = () => {
  const { t } = useTranslation();
  const { farmer } = useStubData();

  const cropData = [
    {
      name: 'Rice',
      area: '10 acres',
      stage: 'Flowering',
      expectedYield: '2.5 tons/acre',
      health: 'Good'
    },
    {
      name: 'Wheat',
      area: '8 acres', 
      stage: 'Harvesting',
      expectedYield: '3.2 tons/acre',
      health: 'Excellent'
    },
    {
      name: 'Cotton',
      area: '7.5 acres',
      stage: 'Vegetative',
      expectedYield: '1.8 tons/acre',
      health: 'Fair'
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sprout className="w-5 h-5 mr-2" />
            Crop Performance Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Tracking crops for farmer: {farmer.name} in {farmer.village}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cropData.map((crop, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-lg">{crop.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Area: {crop.area}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-green-500" />
                <span className="text-sm">Stage: {crop.stage}</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <span className="text-sm">Expected: {crop.expectedYield}</span>
              </div>
              <div className={`inline-block px-2 py-1 rounded text-xs ${
                crop.health === 'Excellent' ? 'bg-green-100 text-green-800' :
                crop.health === 'Good' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                Health: {crop.health}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
