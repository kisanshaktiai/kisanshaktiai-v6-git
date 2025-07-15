
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus } from 'lucide-react';

export const MyLands: React.FC = () => {
  const { t } = useTranslation();

  const mockLands = [
    {
      id: 1,
      name: 'Field 1',
      area: '2.5 acres',
      crop: 'Wheat',
      status: 'Growing',
      location: 'North Plot',
    },
    {
      id: 2,
      name: 'Field 2',
      area: '1.8 acres',
      crop: 'Rice',
      status: 'Harvested',
      location: 'South Plot',
    },
  ];

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('navigation.my_lands')}
        </h1>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Land
        </Button>
      </div>

      <div className="space-y-4">
        {mockLands.map((land) => (
          <Card key={land.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{land.name}</CardTitle>
                <Badge variant={land.status === 'Growing' ? 'default' : 'secondary'}>
                  {land.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Area:</span>
                  <div className="font-medium">{land.area}</div>
                </div>
                <div>
                  <span className="text-gray-600">Crop:</span>
                  <div className="font-medium">{land.crop}</div>
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-1" />
                {land.location}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {mockLands.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No lands added yet</h3>
          <p className="text-gray-600 mb-4">Add your first land to get started</p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Land
          </Button>
        </div>
      )}
    </div>
  );
};
