
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Apple, 
  Grape, 
  Wheat, 
  Cherry,
  TreePine,
  Leaf,
  Calendar,
  TrendingUp
} from 'lucide-react';

export const FieldManagementSection: React.FC = () => {
  const { t } = useTranslation('dashboard');

  const categories = [
    { id: 'fruit', icon: Apple, label: t('myFields.categories.fruit'), color: 'text-red-600 bg-red-50' },
    { id: 'vegetable', icon: Leaf, label: t('myFields.categories.vegetable'), color: 'text-green-600 bg-green-50' },
    { id: 'grain', icon: Wheat, label: t('myFields.categories.grain'), color: 'text-yellow-600 bg-yellow-50' },
    { id: 'orchards', icon: TreePine, label: t('myFields.categories.orchards'), color: 'text-emerald-600 bg-emerald-50' },
    { id: 'other', icon: Cherry, label: t('myFields.categories.other'), color: 'text-purple-600 bg-purple-50' },
  ];

  const fields = [
    {
      id: '1',
      name: t('myFields.fields.appleField'),
      image: '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png',
      harvest: t('myFields.harvest.ready'),
      health: t('myFields.health.excellent'),
      category: 'fruit'
    },
    {
      id: '2', 
      name: t('myFields.fields.grapeField'),
      image: '/lovable-uploads/b75563a8-f082-47af-90f0-95838d69b700.png',
      harvest: t('myFields.harvest.inDays', { count: 15 }),
      health: t('myFields.health.good'),
      category: 'fruit'
    },
    {
      id: '3',
      name: t('myFields.fields.wheatField'),
      image: '/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png',
      harvest: t('myFields.harvest.inDays', { count: 45 }),
      health: t('myFields.health.good'),
      category: 'grain'
    },
    {
      id: '4',
      name: t('myFields.fields.tomatoField'),
      image: '/lovable-uploads/b75563a8-f082-47af-90f0-95838d69b700.png',
      harvest: t('myFields.harvest.inDays', { count: 8 }),
      health: t('myFields.health.excellent'),
      category: 'vegetable'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="px-4">
        <h3 className="text-lg font-semibold text-foreground">{t('myFields.title')}</h3>
        <p className="text-sm text-muted-foreground">{t('myFields.subtitle')}</p>
      </div>

      {/* Category Icons */}
      <div className="px-4">
        <div className="flex justify-between">
          {categories.map((category) => (
            <div key={category.id} className="text-center">
              <div className={`w-12 h-12 rounded-full ${category.color} flex items-center justify-center mb-2 mx-auto hover:scale-110 transition-transform duration-200`}>
                <category.icon className="w-6 h-6" />
              </div>
              <p className="text-xs text-gray-600">{category.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Field Cards */}
      <div className="px-4">
        <div className="grid grid-cols-2 gap-3">
          {fields.map((field) => (
            <Card key={field.id} className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 hover:scale-105 transition-all duration-200 cursor-pointer group overflow-hidden">
              <CardContent className="p-0">
                {/* Field Image */}
                <div className="relative h-24 overflow-hidden">
                  <img 
                    src={field.image} 
                    alt={field.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 bg-black/20 backdrop-blur-sm rounded-full p-1">
                    <TrendingUp className="w-3 h-3 text-white" />
                  </div>
                </div>

                {/* Field Info */}
                <div className="p-3">
                  <h4 className="font-semibold text-sm text-foreground mb-2 truncate">
                    {field.name}
                  </h4>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-green-700 font-medium">
                        {field.harvest}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-xs text-muted-foreground">
                        {field.health}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
