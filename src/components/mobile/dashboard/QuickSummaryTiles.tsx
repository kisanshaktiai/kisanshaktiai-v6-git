
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Card, CardContent } from '@/components/ui/card';
import { Sprout, MapPin, TrendingUp, DollarSign } from 'lucide-react';

interface SummaryTile {
  id: string;
  icon: React.ComponentType<any>;
  title: string;
  value: string;
  subtitle: string;
  color: string;
  bgColor: string;
}

export const QuickSummaryTiles: React.FC = () => {
  const { t } = useTranslation();
  const { profile } = useSelector((state: RootState) => state.farmer);
  const { lands, crops } = useSelector((state: RootState) => state.farmer);

  // Safely get total land acres from farmer profile or calculate from lands
  const getTotalLandAcres = (): number => {
    // Try to get from profile first (if it has the property)
    if (profile && 'total_land_acres' in profile && typeof profile.total_land_acres === 'number') {
      return profile.total_land_acres;
    }
    
    // Calculate from lands array if available
    if (lands && Array.isArray(lands)) {
      return lands.reduce((total, land) => total + (land.area_acres || 0), 0);
    }
    
    return 0;
  };

  const summaryData: SummaryTile[] = [
    {
      id: 'land-area',
      icon: MapPin,
      title: t('dashboard.totalLand', 'Total Land'),
      value: `${getTotalLandAcres()}`,
      subtitle: t('dashboard.acres', 'acres'),
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      id: 'active-crops',
      icon: Sprout,
      title: t('dashboard.activeCrops', 'Active Crops'),
      value: `${crops?.length || 0}`,
      subtitle: t('dashboard.varieties', 'varieties'),
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: 'yield-performance',
      icon: TrendingUp,
      title: t('dashboard.lastYield', 'Last Yield'),
      value: '2.5T',
      subtitle: t('dashboard.perAcre', 'per acre'),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'income-expenses',
      icon: DollarSign,
      title: t('dashboard.netIncome', 'Net Income'),
      value: '₹15,000',
      subtitle: t('dashboard.lastMonth', 'last 30 days'),
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <div className="px-4 py-3">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        {t('dashboard.quickOverview', 'Quick Overview')}
      </h2>
      
      <div className="flex gap-3 overflow-x-auto pb-2">
        {summaryData.map((tile) => {
          const Icon = tile.icon;
          return (
            <Card key={tile.id} className="min-w-[140px] flex-shrink-0">
              <CardContent className="p-4">
                <div className={`w-10 h-10 ${tile.bgColor} rounded-lg flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${tile.color}`} />
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">{tile.title}</p>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-xl font-bold text-gray-900">{tile.value}</span>
                    <span className="text-xs text-gray-500">{tile.subtitle}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
