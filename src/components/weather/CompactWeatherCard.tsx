
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { useEnhancedWeatherData } from '@/hooks/useEnhancedWeatherData';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  RefreshCw,
  MapPin,
  AlertTriangle,
  CloudRain
} from 'lucide-react';

export const CompactWeatherCard: React.FC = () => {
  const { t } = useTranslation('dashboard');
  const { 
    currentWeather, 
    loading, 
    error, 
    refreshWeather, 
    hasLocation 
  } = useEnhancedWeatherData();

  if (!hasLocation) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="p-3">
          <div className="flex items-center justify-center space-x-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-blue-700">{t('common.fetchingLocation')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="p-3">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-xs text-blue-700">{t('weather.loadingWeather')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !currentWeather) {
    return (
      <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span className="text-xs font-medium text-orange-800">{t('weather.dataUnavailable')}</span>
            </div>
            <button 
              onClick={refreshWeather}
              className="bg-orange-100 hover:bg-orange-200 rounded-full p-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3 text-orange-600" />
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 via-white to-blue-50 border-blue-200">
      <CardContent className="p-4">
        {/* Header with refresh */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">{t('weather.location')}</span>
          </div>
          <button 
            onClick={refreshWeather}
            className="bg-blue-50 hover:bg-blue-100 rounded-full p-1 transition-colors"
          >
            <RefreshCw className="w-3 h-3 text-blue-600" />
          </button>
        </div>

        {/* Main weather info */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(currentWeather.temperature_celsius)}°C
            </div>
            <div>
              <p className="text-sm text-gray-600 capitalize">
                {currentWeather.weather_description}
              </p>
              <p className="text-xs text-gray-500">
                {t('weather.feelsLike')} {Math.round(currentWeather.feels_like_celsius)}°
              </p>
            </div>
          </div>
        </div>

        {/* Compact metrics */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-blue-50 rounded-md">
            <CloudRain className="w-3 h-3 text-blue-600 mx-auto mb-1" />
            <div className="text-xs font-medium text-gray-900">
              {currentWeather.rain_1h_mm || 0}mm
            </div>
          </div>
          
          <div className="text-center p-2 bg-green-50 rounded-md">
            <Wind className="w-3 h-3 text-green-600 mx-auto mb-1" />
            <div className="text-xs font-medium text-gray-900">
              {Math.round(currentWeather.wind_speed_kmh)}km/h
            </div>
          </div>
          
          <div className="text-center p-2 bg-purple-50 rounded-md">
            <Droplets className="w-3 h-3 text-purple-600 mx-auto mb-1" />
            <div className="text-xs font-medium text-gray-900">
              {currentWeather.humidity_percent}%
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
