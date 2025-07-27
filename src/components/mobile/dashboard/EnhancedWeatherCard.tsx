
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { useEnhancedWeatherData } from '@/hooks/useEnhancedWeatherData';
import { 
  Cloud, 
  CloudRain, 
  Sun, 
  Zap,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

export const EnhancedWeatherCard: React.FC = () => {
  const { t } = useTranslation('dashboard');
  const { 
    currentWeather, 
    loading, 
    error, 
    refreshWeather, 
    hasLocation 
  } = useEnhancedWeatherData();

  if (!hasLocation || loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin text-green-600" />
        <span className="ml-2 text-gray-600">{t('weather.loadingWeather')}</span>
      </div>
    );
  }

  if (error || !currentWeather) {
    return (
      <div className="flex items-center justify-center py-8">
        <AlertTriangle className="w-6 h-6 text-orange-600" />
        <span className="ml-2 text-gray-600">{t('weather.dataUnavailable')}</span>
      </div>
    );
  }

  const getWeatherIcon = (description: string) => {
    const desc = description.toLowerCase();
    if (desc.includes('rain')) return CloudRain;
    if (desc.includes('cloud')) return Cloud;
    if (desc.includes('storm')) return Zap;
    return Sun;
  };

  const WeatherIcon = getWeatherIcon(currentWeather.weather_description);

  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-4">
        {/* Temperature */}
        <div className="text-5xl font-bold text-green-800">
          {Math.round(currentWeather.temperature_celsius)}°C
        </div>
        
        {/* Weather condition */}
        <div className="text-right">
          <div className="flex items-center space-x-2 mb-1">
            <WeatherIcon className="w-8 h-8 text-blue-500" />
            <span className="text-lg text-gray-700 capitalize">
              {currentWeather.weather_description.split(' ').slice(0, 2).join(' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Additional info */}
      <div className="flex items-center space-x-6 text-sm text-gray-600">
        <div className="flex items-center space-x-1">
          <Zap className="w-4 h-4" />
          <span>Moderate</span>
        </div>
        <div className="flex items-center space-x-1">
          <span>🕙</span>
          <span>{new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          })}</span>
        </div>
      </div>
    </div>
  );
};
