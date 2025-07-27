
import React, { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useOptimizedDashboard } from '@/hooks/useOptimizedDashboard';
import { CompactWeatherCard } from '@/components/weather/CompactWeatherCard';
import { 
  Satellite, 
  MessageSquare, 
  Calendar, 
  TrendingUp,
  Camera,
  Users,
  ShoppingCart,
  BarChart3
} from 'lucide-react';

const LazyFeatureCard = React.lazy(() => 
  Promise.resolve({ 
    default: ({ icon: Icon, title, subtitle, color, bgColor, onClick }: any) => (
      <Card className="hover:shadow-md transition-all duration-200 cursor-pointer" onClick={onClick}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${bgColor}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 truncate">{title}</h3>
              <p className="text-xs text-gray-500 truncate">{subtitle}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  })
);

export const ProfessionalFeatureGrid: React.FC = () => {
  const { t } = useTranslation();
  const { data: dashboardData, isLoading } = useOptimizedDashboard();

  const features = [
    {
      icon: Satellite,
      title: t('features.satelliteMonitoring'),
      subtitle: t('features.satelliteMonitoringDesc'),
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      path: '/satellite'
    },
    {
      icon: MessageSquare,
      title: t('features.aiAdvisor'),
      subtitle: t('features.aiAdvisorDesc'),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      path: '/ai-chat'
    },
    {
      icon: Calendar,
      title: t('features.cropCalendar'),
      subtitle: t('features.cropCalendarDesc'),
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      path: '/crop-schedule'
    },
    {
      icon: TrendingUp,
      title: t('features.marketPrice'),
      subtitle: t('features.marketPriceDesc'),
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      path: '/market'
    },
    {
      icon: Camera,
      title: t('features.instaScan'),
      subtitle: t('features.instaScanDesc'),
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      path: '/insta-scan'
    },
    {
      icon: Users,
      title: t('features.community'),
      subtitle: t('features.communityDesc'),
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      path: '/community'
    },
    {
      icon: ShoppingCart,
      title: t('features.marketplace'),
      subtitle: t('features.marketplaceDesc'),
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      path: '/market'
    },
    {
      icon: BarChart3,
      title: t('features.reports'),
      subtitle: t('features.reportsDesc'),
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      path: '/analytics'
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    );
  }

  const handleFeatureClick = (path: string) => {
    window.location.href = path;
  };

  return (
    <div className="space-y-4 p-4">
      {/* Weather Card */}
      <CompactWeatherCard />
      
      {/* Feature Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Suspense fallback={
          <div className="grid grid-cols-2 gap-3 col-span-2">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        }>
          {features.map((feature, index) => (
            <LazyFeatureCard
              key={index}
              {...feature}
              onClick={() => handleFeatureClick(feature.path)}
            />
          ))}
        </Suspense>
      </div>
    </div>
  );
};
