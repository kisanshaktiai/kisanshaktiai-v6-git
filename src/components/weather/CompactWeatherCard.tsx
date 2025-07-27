
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
  AlertTriangle
} from 'lucide-react';

export const CompactWeatherCard: React.FC = () => {
  const { t } = useTranslation();
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
      <Card className="bg-gradient-to-br from-blue-400 to-blue-600 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-center space-x-2">
            <MapPin className="w-5 h-5" />
            <span className="text-sm">{t('common.fetchingLocation')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-blue-400 to-blue-600 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="text-sm">{t('weather.loadingWeather')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !currentWeather) {
    return (
      <Card className="bg-gradient-to-br from-orange-400 to-red-500 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <div>
                <p className="text-sm font-medium">{t('weather.dataUnavailable')}</p>
                <p className="text-xs opacity-90">
                  {error || t('common.tryAgain')}
                </p>
              </div>
            </div>
            <button 
              onClick={refreshWeather}
              className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getWeatherGradient = (condition: string) => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('clear') || lowerCondition.includes('sunny')) {
      return 'from-yellow-400 to-orange-500';
    }
    if (lowerCondition.includes('cloud')) {
      return 'from-gray-400 to-gray-600';
    }
    if (lowerCondition.includes('rain')) {
      return 'from-blue-500 to-blue-700';
    }
    return 'from-blue-400 to-blue-600';
  };

  return (
    <Card className={`bg-gradient-to-br ${getWeatherGradient(currentWeather.weather_main)} text-white`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-center">
              <div className="flex items-center space-x-1 mb-1">
                <Thermometer className="w-4 h-4" />
                <span className="text-2xl font-bold">
                  {Math.round(currentWeather.temperature_celsius)}°
                </span>
              </div>
              <p className="text-xs opacity-90 capitalize">
                {currentWeather.weather_description}
              </p>
            </div>
            
            <div className="text-xs space-y-1 opacity-90">
              <div className="flex items-center space-x-1">
                <Droplets className="w-3 h-3" />
                <span>{currentWeather.humidity_percent}%</span>
              </div>
              <div className="flex items-center space-x-1">
                <Wind className="w-3 h-3" />
                <span>{Math.round(currentWeather.wind_speed_kmh)} km/h</span>
              </div>
              <div className="flex items-center space-x-1">
                <Thermometer className="w-3 h-3" />
                <span>{t('weather.feelsLike')} {Math.round(currentWeather.feels_like_celsius)}°</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <button 
              onClick={refreshWeather}
              className="bg-white/20 hover:bg-white/30 rounded-full p-2 mb-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            
            {lastFetch && (
              <div className="flex items-center space-x-1 text-xs opacity-75">
                <Clock className="w-3 h-3" />
                <span>{lastFetch.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}</span>
              </div>
            )}
            
            {currentWeather.data_source && (
              <div className="text-xs opacity-60 mt-1">
                {currentWeather.data_source === 'tomorrow_io' ? 'Tomorrow.io' : 'OpenWeather'}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
