
import React from 'react';
import { useTranslation } from 'react-i18next';
import { CloudSun, Droplets, Wind, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useEnhancedWeatherData } from '@/hooks/useEnhancedWeatherData';

export const TenantWeatherCard: React.FC = () => {
  const { t } = useTranslation();
  const { currentWeather, loading } = useEnhancedWeatherData();

  if (loading) {
    return (
      <Card className="mx-4 mb-4">
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3 mb-3"></div>
            <div className="flex items-center justify-between">
              <div className="h-8 bg-muted rounded w-1/4"></div>
              <div className="h-12 bg-muted rounded-full w-12"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-4 mb-4 bg-gradient-to-br from-sky-50 to-blue-50 border-sky-100">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-foreground text-sm">
              {t('dashboard.weather.title', 'Current Weather')}
            </h3>
            <p className="text-muted-foreground text-xs">
              {new Date().toLocaleTimeString('en-IN', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          </div>
          <CloudSun className="w-8 h-8 text-sky-500" />
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-2xl font-bold text-foreground">
              {currentWeather?.temperature_celsius || 28}°C
            </div>
            <div className="text-sm text-muted-foreground capitalize">
              {currentWeather?.weather_description || t('dashboard.weather.sunny', 'Sunny')}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-xs">
          <div className="flex items-center space-x-1">
            <Droplets className="w-3 h-3 text-blue-500" />
            <span className="text-muted-foreground">
              {currentWeather?.humidity_percent || 65}%
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Wind className="w-3 h-3 text-gray-500" />
            <span className="text-muted-foreground">
              {currentWeather?.wind_speed_kmh || 12} km/h
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Eye className="w-3 h-3 text-purple-500" />
            <span className="text-muted-foreground">
              {currentWeather?.visibility_km || 10} km
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
