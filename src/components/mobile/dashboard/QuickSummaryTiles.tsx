
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sprout, 
  MapPin, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Droplets,
  Thermometer,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

interface SummaryTile {
  id: string;
  icon: React.ComponentType<any>;
  title: string;
  value: string | number;
  previousValue?: number;
  subtitle: string;
  color: string;
  bgGradient: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  sparklineData?: number[];
  isLoading?: boolean;
}

// Simple Sparkline Component
const Sparkline: React.FC<{ data: number[]; color: string; width?: number; height?: number }> = ({ 
  data, 
  color, 
  width = 60, 
  height = 20 
}) => {
  if (!data || data.length < 2) return null;
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg width={width} height={height} className="opacity-70">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        className="drop-shadow-sm"
      />
    </svg>
  );
};

// Animated Counter Component
const AnimatedCounter: React.FC<{ value: string | number; duration?: number }> = ({ 
  value, 
  duration = 1000 
}) => {
  const [displayValue, setDisplayValue] = useState<string>('0');
  
  useEffect(() => {
    if (typeof value === 'string') {
      // For non-numeric strings, just set directly
      setDisplayValue(value);
      return;
    }
    
    const numericValue = parseFloat(value.toString());
    if (isNaN(numericValue)) {
      setDisplayValue(value.toString());
      return;
    }
    
    let startValue = 0;
    const increment = numericValue / (duration / 16); // 60fps
    
    const timer = setInterval(() => {
      startValue += increment;
      if (startValue >= numericValue) {
        setDisplayValue(numericValue.toString());
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(startValue).toString());
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [value, duration]);
  
  return <span className="font-bold text-xl">{displayValue}</span>;
};

// Loading Skeleton
const TileSkeleton: React.FC = () => (
  <Card className="min-w-[160px] flex-shrink-0 animate-pulse">
    <CardContent className="p-4">
      <div className="w-12 h-12 bg-gray-200 rounded-xl mb-3"></div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded w-20"></div>
        <div className="h-6 bg-gray-200 rounded w-16"></div>
        <div className="h-3 bg-gray-200 rounded w-14"></div>
      </div>
    </CardContent>
  </Card>
);

export const QuickSummaryTiles: React.FC = () => {
  const { t } = useTranslation();
  const { profile, lands, crops } = useSelector((state: RootState) => state.farmer);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading for better UX
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Safely get total land acres from farmer profile or calculate from lands
  const getTotalLandAcres = (): number => {
    if (lands && Array.isArray(lands)) {
      return lands.reduce((total, land) => total + (land.area_acres || 0), 0);
    }
    return 0;
  };

  // Mock data for professional look with trends
  const summaryData: SummaryTile[] = [
    {
      id: 'land-area',
      icon: MapPin,
      title: t('dashboard.totalLand', 'Total Land'),
      value: getTotalLandAcres(),
      previousValue: getTotalLandAcres() - 0.5,
      subtitle: t('dashboard.acres', 'acres'),
      color: '#10B981',
      bgGradient: 'from-emerald-500/20 via-green-500/10 to-teal-500/20',
      trend: 'stable',
      sparklineData: [2.1, 2.3, 2.2, 2.4, 2.5, getTotalLandAcres()]
    },
    {
      id: 'active-crops',
      icon: Sprout,
      title: t('dashboard.activeCrops', 'Active Crops'),
      value: crops?.length || 0,
      previousValue: (crops?.length || 0) - 1,
      subtitle: t('dashboard.varieties', 'varieties'),
      color: '#059669',
      bgGradient: 'from-green-500/20 via-lime-500/10 to-emerald-500/20',
      trend: 'up',
      trendValue: '+12%',
      sparklineData: [2, 3, 2, 4, 3, crops?.length || 0]
    },
    {
      id: 'yield-performance',
      icon: BarChart3,
      title: t('dashboard.avgYield', 'Avg Yield'),
      value: '2.5T',
      previousValue: 2.3,
      subtitle: t('dashboard.perAcre', 'per acre'),
      color: '#3B82F6',
      bgGradient: 'from-blue-500/20 via-sky-500/10 to-cyan-500/20',
      trend: 'up',
      trendValue: '+8.7%',
      sparklineData: [2.1, 2.0, 2.3, 2.2, 2.4, 2.5]
    },
    {
      id: 'soil-moisture',
      icon: Droplets,
      title: t('dashboard.soilMoisture', 'Soil Moisture'),
      value: '68%',
      previousValue: 65,
      subtitle: t('dashboard.optimal', 'optimal'),
      color: '#06B6D4',
      bgGradient: 'from-cyan-500/20 via-blue-500/10 to-sky-500/20',
      trend: 'up',
      trendValue: '+3%',
      sparklineData: [62, 60, 65, 63, 67, 68]
    },
    {
      id: 'weather-temp',
      icon: Thermometer,
      title: t('dashboard.temperature', 'Temperature'),
      value: '28°C',
      previousValue: 26,
      subtitle: t('dashboard.current', 'current'),
      color: '#F59E0B',
      bgGradient: 'from-yellow-500/20 via-orange-500/10 to-amber-500/20',
      trend: 'up',
      trendValue: '+2°C',
      sparklineData: [24, 25, 26, 27, 26, 28]
    },
    {
      id: 'income-expenses',
      icon: DollarSign,
      title: t('dashboard.netIncome', 'Net Income'),
      value: '₹15,000',
      previousValue: 12000,
      subtitle: t('dashboard.thisMonth', 'this month'),
      color: '#8B5CF6',
      bgGradient: 'from-purple-500/20 via-violet-500/10 to-indigo-500/20',
      trend: 'up',
      trendValue: '+25%',
      sparklineData: [8000, 10000, 9500, 12000, 11000, 15000]
    }
  ];

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="w-3 h-3 text-green-600" />;
      case 'down':
        return <ArrowDown className="w-3 h-3 text-red-600" />;
      default:
        return <Minus className="w-3 h-3 text-gray-400" />;
    }
  };

  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'down':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 py-6">
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {[...Array(4)].map((_, i) => (
              <TileSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">
          {t('dashboard.farmOverview', 'Farm Overview')}
        </h2>
        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">
          {t('dashboard.liveData', 'Live Data')}
        </Badge>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1 scrollbar-hide">
        {summaryData.map((tile, index) => {
          const Icon = tile.icon;
          return (
            <Card 
              key={tile.id}
              className="min-w-[160px] flex-shrink-0 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border-0 shadow-md backdrop-blur-sm animate-fade-in"
              style={{ 
                animationDelay: `${index * 100}ms`,
                background: `linear-gradient(135deg, white 0%, ${tile.bgGradient.includes('from-') ? 'transparent' : 'white'} 100%)`
              }}
            >
              <CardContent className="p-4 relative overflow-hidden">
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${tile.bgGradient} opacity-60`}></div>
                
                {/* Floating Decoration */}
                <div 
                  className="absolute -top-2 -right-2 w-16 h-16 rounded-full blur-xl opacity-30"
                  style={{ backgroundColor: tile.color }}
                ></div>
                
                {/* Content */}
                <div className="relative z-10 space-y-3">
                  {/* Icon and Trend */}
                  <div className="flex items-center justify-between">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-sm border border-white/30"
                      style={{ backgroundColor: `${tile.color}20` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: tile.color }} />
                    </div>
                    
                    {tile.trend && tile.trendValue && (
                      <Badge 
                        variant="secondary" 
                        className={`text-xs px-2 py-1 rounded-full border ${getTrendColor(tile.trend)} font-medium`}
                      >
                        <span className="flex items-center space-x-1">
                          {getTrendIcon(tile.trend)}
                          <span>{tile.trendValue}</span>
                        </span>
                      </Badge>
                    )}
                  </div>
                  
                  {/* Title and Description */}
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-700 leading-tight">
                      {tile.title}
                    </p>
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline space-x-1">
                        <AnimatedCounter value={tile.value} />
                        <span className="text-xs text-gray-500 font-medium">
                          {tile.subtitle}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Sparkline */}
                  {tile.sparklineData && (
                    <div className="flex justify-end mt-2">
                      <Sparkline 
                        data={tile.sparklineData} 
                        color={tile.color}
                        width={50}
                        height={16}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Info Bar */}
      <Card className="bg-gradient-to-r from-green-50/80 to-blue-50/80 border-green-100">
        <CardContent className="p-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-gray-700 font-medium">
                {t('dashboard.dataUpdated', 'Data updated')} 
                <span className="text-green-600 ml-1">2 min ago</span>
              </span>
            </div>
            <button className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
              {t('dashboard.viewDetails', 'View Details')}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
