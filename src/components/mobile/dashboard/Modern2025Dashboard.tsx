import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Cloud, 
  Droplets, 
  Sprout, 
  TrendingUp,
  Calendar,
  MapPin,
  Bell,
  BarChart3,
  Leaf,
  Sun,
  Wind,
  CloudRain,
  ThermometerSun,
  Wheat,
  PackageCheck,
  MessageSquare,
  Sparkles,
  Activity,
  Shield
} from 'lucide-react';
import { Card } from '@/components/ui/card';

import { useAuth } from '@/hooks/useAuth';
import { useUnifiedTenantData } from '@/hooks/useUnifiedTenantData';
import { useWeatherData } from '@/hooks/useWeatherData';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface QuickStatProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: string;
  color: string;
}

const QuickStat: React.FC<QuickStatProps> = ({ icon, label, value, trend, color }) => (
  <div
    className={cn(
      "relative p-4 rounded-2xl border border-border/50",
      "bg-gradient-to-br from-background/50 to-background/30",
      "backdrop-blur-xl shadow-sm hover:shadow-md transition-all",
      "animate-fade-in"
    )}
  >
    <div className="flex items-start justify-between mb-3">
      <div className={cn("p-2 rounded-xl", color)}>
        {icon}
      </div>
      {trend && (
        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
          {trend}
        </span>
      )}
    </div>
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
        {value}
      </p>
    </div>
  </div>
);

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  gradient: string;
  badge?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ 
  icon, 
  title, 
  description, 
  onClick, 
  gradient,
  badge 
}) => (
  <div
    onClick={onClick}
    className={cn(
      "relative group cursor-pointer",
      "rounded-2xl border border-border/50 overflow-hidden",
      "bg-gradient-to-br from-background to-background/50",
      "backdrop-blur-xl shadow-sm hover:shadow-xl transition-all",
      "hover:scale-105 active:scale-95 transform-gpu"
    )}
  >
    {badge && (
      <div className="absolute top-3 right-3 z-10">
        <span className="px-2 py-1 text-xs font-semibold bg-primary/10 text-primary rounded-full">
          {badge}
        </span>
      </div>
    )}
    
    <div className={cn("h-32 relative overflow-hidden", gradient)}>
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      <div className="absolute bottom-3 left-3 text-white/90">
        {icon}
      </div>
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <div className="relative w-full h-full">
          {icon}
        </div>
      </div>
    </div>
    
    <div className="p-4 space-y-2">
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
    </div>
    
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity"
         style={{ background: gradient.replace('bg-gradient-to-br', 'linear-gradient(90deg') }} />
  </div>
);

export const Modern2025Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile, farmer } = useAuth();
  const { tenant, branding, features } = useUnifiedTenantData(farmer?.tenant_id);
  const { currentWeather: weather, loading: weatherLoading } = useWeatherData();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting(t('dashboard.goodMorning'));
    else if (hour < 17) setGreeting(t('dashboard.goodAfternoon'));
    else setGreeting(t('dashboard.goodEvening'));
  }, [t]);

  const quickStats = [
    {
      icon: <Wheat className="w-5 h-5 text-green-600" />,
      label: t('dashboard.activeCrops'),
      value: farmer?.primary_crops?.length || 0,
      trend: '+12%',
      color: 'bg-green-100'
    },
    {
      icon: <MapPin className="w-5 h-5 text-blue-600" />,
      label: t('dashboard.totalLands'),
      value: `${farmer?.total_land_acres || 0} ${t('dashboard.acres')}`,
      color: 'bg-blue-100'
    },
    {
      icon: <Activity className="w-5 h-5 text-orange-600" />,
      label: t('dashboard.healthScore'),
      value: '85%',
      trend: '+5%',
      color: 'bg-orange-100'
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-purple-600" />,
      label: t('dashboard.yieldForecast'),
      value: '92%',
      trend: '+8%',
      color: 'bg-purple-100'
    }
  ];

  const featureCards = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: t('features.aiAssistant'),
      description: t('features.aiAssistantDesc'),
      gradient: 'bg-gradient-to-br from-purple-500 to-pink-500',
      badge: 'AI',
      onClick: () => navigate('/ai-chat')
    },
    {
      icon: <Cloud className="w-6 h-6" />,
      title: t('features.weather'),
      description: t('features.weatherDesc'),
      gradient: 'bg-gradient-to-br from-blue-500 to-cyan-500',
      onClick: () => navigate('/weather')
    },
    {
      icon: <Leaf className="w-6 h-6" />,
      title: t('features.cropSchedule'),
      description: t('features.cropScheduleDesc'),
      gradient: 'bg-gradient-to-br from-green-500 to-emerald-500',
      onClick: () => navigate('/crop-schedule')
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: t('features.analytics'),
      description: t('features.analyticsDesc'),
      gradient: 'bg-gradient-to-br from-orange-500 to-red-500',
      badge: 'PRO',
      onClick: () => navigate('/analytics')
    },
    {
      icon: <PackageCheck className="w-6 h-6" />,
      title: t('features.marketplace'),
      description: t('features.marketplaceDesc'),
      gradient: 'bg-gradient-to-br from-indigo-500 to-purple-500',
      onClick: () => navigate('/market')
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: t('features.community'),
      description: t('features.communityDesc'),
      gradient: 'bg-gradient-to-br from-teal-500 to-green-500',
      onClick: () => navigate('/community')
    }
  ];

  // Weather Widget Component
  const WeatherWidget = () => {
    if (weatherLoading || !weather) {
      return (
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-0">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-white/50 rounded w-1/2" />
            <div className="h-8 bg-white/50 rounded w-3/4" />
          </div>
        </Card>
      );
    }

    return (
      <div
        className="relative p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white overflow-hidden animate-fade-in"
      >
        <div className="absolute top-0 right-0 w-32 h-32 opacity-20">
          <Sun className="w-full h-full" />
        </div>
        
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">{t('dashboard.currentWeather')}</p>
              <p className="text-3xl font-bold">{Math.round(weather.temperature_celsius)}°C</p>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-sm">{weather.weather_main}</p>
              <div className="flex items-center gap-2 mt-1">
                <Droplets className="w-4 h-4" />
                <span className="text-sm">{weather.humidity_percent}%</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/20">
            <div className="text-center">
              <Wind className="w-4 h-4 mx-auto mb-1 text-white/80" />
              <p className="text-xs text-white/80">{weather.wind_speed_kmh} km/h</p>
            </div>
            <div className="text-center">
              <CloudRain className="w-4 h-4 mx-auto mb-1 text-white/80" />
              <p className="text-xs text-white/80">0 mm</p>
            </div>
            <div className="text-center">
              <ThermometerSun className="w-4 h-4 mx-auto mb-1 text-white/80" />
              <p className="text-xs text-white/80">{weather.feels_like_celsius}°C</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                {greeting}, {profile?.full_name || 'Farmer'}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {format(new Date(), 'EEEE, dd MMMM yyyy')}
              </p>
            </div>
            <button
              className="relative p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-all hover:scale-105 active:scale-95"
            >
              <Bell className="w-5 h-5 text-primary" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6 pb-24">
        {/* Weather Widget */}
        <WeatherWidget />

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          {quickStats.map((stat, index) => (
            <QuickStat key={index} {...stat} />
          ))}
        </div>

        {/* Feature Cards */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-foreground">
            {t('dashboard.features')}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {featureCards.map((card, index) => (
              <FeatureCard key={index} {...card} />
            ))}
          </div>
        </div>

        {/* Tenant Branding */}
        {branding && (
          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              Powered by {branding.app_name || tenant?.name}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};