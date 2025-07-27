
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
  Clock,
  AlertTriangle,
  CloudRain
} from 'lucide-react';

export const CompactWeatherCard: React.FC = () => {
  const { t } = useTranslation('dashboard');
  const { 
    currentWeather, 
    loading, 
    error, 
    lastFetch, 
    refreshWeather, 
    hasLocation 
  } = useEnhancedWeatherData();

  if (!hasLocation) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-center space-x-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-blue-700">{t('common.fetchingLocation')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-sm text-blue-700">{t('weather.loadingWeather')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !currentWeather) {
    return (
      <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-orange-800">{t('weather.dataUnavailable')}</p>
                <p className="text-xs text-orange-600">
                  {error || t('common.tryAgain')}
                </p>
              </div>
            </div>
            <button 
              onClick={refreshWeather}
              className="bg-orange-100 hover:bg-orange-200 rounded-full p-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-orange-600" />
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentTime = new Date();
  const formattedDate = currentTime.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  });
  const formattedTime = currentTime.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <Card className="bg-gradient-to-br from-blue-50 via-white to-blue-50 border-blue-200">
      <CardContent className="p-6">
        {/* Location Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-semibold text-gray-900">{t('weather.location')}</p>
              <p className="text-sm text-gray-600">{formattedDate}</p>
            </div>
          </div>
          <button 
            onClick={refreshWeather}
            className="bg-blue-50 hover:bg-blue-100 rounded-full p-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-blue-600" />
          </button>
        </div>

        {/* Main Weather Display */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-1">
                {Math.round(currentWeather.temperature_celsius)}°
              </div>
              <p className="text-sm text-gray-600 capitalize">
                {currentWeather.weather_description}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-lg font-medium text-gray-700 mb-1">
              {t('weather.feelsLike')} {Math.round(currentWeather.feels_like_celsius)}°
            </div>
            <div className="text-sm text-gray-500">
              {formattedTime}
            </div>
          </div>
        </div>

        {/* Weather Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <CloudRain className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <div className="text-sm font-medium text-gray-900">
              {currentWeather.rain_1h_mm || 0}mm
            </div>
            <div className="text-xs text-gray-600">{t('weather.precipitation')}</div>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <Wind className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <div className="text-sm font-medium text-gray-900">
              {Math.round(currentWeather.wind_speed_kmh)} km/h
            </div>
            <div className="text-xs text-gray-600">{t('weather.windSpeed')}</div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <Droplets className="w-5 h-5 text-purple-600 mx-auto mb-1" />
            <div className="text-sm font-medium text-gray-900">
              {currentWeather.humidity_percent}%
            </div>
            <div className="text-xs text-gray-600">{t('weather.humidity')}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
