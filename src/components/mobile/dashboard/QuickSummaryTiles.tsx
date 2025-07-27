
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useOptimizedDashboard } from '@/hooks/useOptimizedDashboard';
import { 
  MapPin, 
  Sprout, 
  TrendingUp, 
  Calendar, 
  AlertTriangle,
  IndianRupee 
} from 'lucide-react';

export const QuickSummaryTiles: React.FC = () => {
  const { data: dashboardData, isLoading, error } = useOptimizedDashboard();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 p-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="p-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 text-sm">डेटा लोड नहीं हो सका</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { summary } = dashboardData;

  const tiles = [
    {
      icon: MapPin,
      label: 'कुल भूमि',
      value: `${summary.totalLands} खेत`,
      subvalue: `${summary.totalArea} एकड़`,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Sprout,
      label: 'सक्रिय फसलें',
      value: summary.activeCrops.toString(),
      subvalue: 'बढ़ रही हैं',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: IndianRupee,
      label: 'शुद्ध लाभ',
      value: `₹${(summary.netProfit / 1000).toFixed(1)}K`,
      subvalue: '90 दिन',
      color: summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: summary.netProfit >= 0 ? 'bg-green-50' : 'bg-red-50'
    },
    {
      icon: Calendar,
      label: 'हाल की गतिविधियां',
      value: summary.recentActivities.toString(),
      subvalue: '30 दिन',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      {tiles.map((tile, index) => {
        const Icon = tile.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${tile.bgColor}`}>
                  <Icon className={`h-5 w-5 ${tile.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600 truncate">{tile.label}</p>
                  <p className="text-lg font-semibold text-gray-900">{tile.value}</p>
                  {tile.subvalue && (
                    <p className="text-xs text-gray-500">{tile.subvalue}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
