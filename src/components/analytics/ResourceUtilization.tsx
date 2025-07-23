
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets, Zap, Truck, Users } from 'lucide-react';
import { useStubData } from '@/hooks/useStubData';

export const ResourceUtilization: React.FC = () => {
  const { t } = useTranslation();
  const { farmer } = useStubData();

  const resourceData = [
    {
      name: 'Water Usage',
      icon: Droplets,
      current: '850 liters/day',
      target: '750 liters/day',
      efficiency: '88%',
      status: 'good'
    },
    {
      name: 'Energy Consumption',
      icon: Zap,
      current: '45 kWh/day',
      target: '40 kWh/day',
      efficiency: '78%',
      status: 'fair'
    },
    {
      name: 'Equipment Usage',
      icon: Truck,
      current: '6 hours/day',
      target: '8 hours/day',
      efficiency: '75%',
      status: 'fair'
    },
    {
      name: 'Labor Efficiency',
      icon: Users,
      current: '4 workers',
      target: '4 workers',
      efficiency: '95%',
      status: 'excellent'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'fair': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Droplets className="w-5 h-5 mr-2" />
            Resource Utilization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Resource efficiency tracking for {farmer.name} - {farmer.village}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {resourceData.map((resource, index) => {
          const Icon = resource.icon;
          return (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Icon className="w-5 h-5 mr-2" />
                  {resource.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Current Usage:</span>
                    <span className="font-medium">{resource.current}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Target:</span>
                    <span className="font-medium">{resource.target}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Efficiency:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold">{resource.efficiency}</span>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(resource.status)}`}>
                        {resource.status}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resource Optimization Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium text-blue-600">💧 Water Conservation</h4>
              <p className="text-sm text-gray-600">Consider drip irrigation to reduce water usage by 30%</p>
            </div>
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium text-green-600">⚡ Energy Efficiency</h4>
              <p className="text-sm text-gray-600">Solar panels could reduce energy costs by 50%</p>
            </div>
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium text-purple-600">🚜 Equipment Optimization</h4>
              <p className="text-sm text-gray-600">Regular maintenance can improve equipment efficiency</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
