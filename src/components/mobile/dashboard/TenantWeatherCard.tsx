
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { 
  CloudSun, Droplets, Wind, Sun, CloudRain, Cloud, Zap, 
  Snowflake, CloudDrizzle, RefreshCw, MapPin
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEnhancedWeatherData } from '@/hooks/useEnhancedWeatherData';
import { getWeatherBackground, getWeatherIcon } from '@/utils/weatherBackgrounds';

export const TenantWeatherCard: React.FC = () => {
  const { t } = useTranslation();
  const { currentWeather, loading, refreshWeather, lastFetch } = useEnhancedWeatherData();
  const { location } = useSelector((state: RootState) => state.farmer);

  const getWeatherBackgroundImage = (condition: string) => {
    const weatherCondition = condition?.toLowerCase() || 'clear';
    
    if (weatherCondition.includes('clear') || weatherCondition.includes('sunny')) {
      return 'linear-gradient(135deg, #74b9ff 0%, #0984e3 50%, #74b9ff 100%)';
    } else if (weatherCondition.includes('cloud')) {
      return 'linear-gradient(135deg, #636e72 0%, #2d3436 50%, #636e72 100%)';
    } else if (weatherCondition.includes('rain')) {
      return 'linear-gradient(135deg, #00b894 0%, #00a085 50%, #00b894 100%)';
    } else if (weatherCondition.includes('thunder')) {
      return 'linear-gradient(135deg, #6c5ce7 0%, #5f27cd 50%, #6c5ce7 100%)';
    } else if (weatherCondition.includes('snow')) {
      return 'linear-gradient(135deg, #ddd 0%, #b2bec3 50%, #ddd 100%)';
    }
    
    return 'linear-gradient(135deg, #74b9ff 0%, #0984e3 50%, #74b9ff 100%)';
  };

  if (loading) {
    return (
      <Card className="mx-4 mb-4 h-24 bg-gradient-to-r from-blue-50 to-sky-50 border-0 overflow-hidden">
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-3 bg-blue-200 rounded w-24"></div>
                <div className="h-6 bg-blue-200 rounded w-16"></div>
              </div>
              <div className="h-8 bg-blue-200 rounded-full w-8"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const weatherBackground = getWeatherBackground(
    currentWeather?.weather_main || 'Clear',
    currentWeather?.weather_description || 'Sunny'
  );

  const WeatherIcon = (() => {
    const iconName = getWeatherIcon(
      currentWeather?.weather_main || 'Clear',
      currentWeather?.weather_description || 'Sunny'
    );
    const icons = { Sun, CloudRain, Cloud, CloudSun, Zap, Snowflake, CloudDrizzle };
    return icons[iconName as keyof typeof icons] || CloudSun;
  })();

  const backgroundImage = getWeatherBackgroundImage(currentWeather?.weather_main || 'Clear');

  return (
    <Card 
      className="mx-4 mb-4 h-24 border-0 overflow-hidden backdrop-blur-md bg-white/20"
      style={{ 
        background: backgroundImage,
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        border: '1px solid rgba(255, 255, 255, 0.18)'
      }}
    >
      <CardContent className="p-4 h-full relative">
        {/* Weather Content */}
        <div className="flex items-center justify-between h-full">
          {/* Left Side - Main Weather Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-1 mb-1">
              <MapPin className="w-3 h-3 text-white/80" />
              <span className="text-xs text-white/80 truncate max-w-[100px]">
                {location?.district || 'Location'}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <WeatherIcon className={`w-8 h-8 text-white ${weatherBackground.animation || ''}`} />
              <div>
                <div className="text-2xl font-bold text-white">
                  {Math.round(currentWeather?.temperature_celsius || 28)}°C
                </div>
                <div className="text-xs text-white/80 capitalize leading-tight">
                  {currentWeather?.weather_description || t('dashboard.weather.sunny', 'Sunny')}
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Side - Additional Info & Refresh */}
          <div className="flex flex-col items-end justify-between h-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshWeather}
              className="h-6 w-6 p-0 text-white/70 hover:text-white hover:bg-white/20"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
            
            <div className="space-y-1 text-right">
              <div className="flex items-center space-x-1 text-xs text-white/80">
                <Droplets className="w-3 h-3" />
                <span>{currentWeather?.humidity_percent || 65}%</span>
              </div>
              <div className="flex items-center space-x-1 text-xs text-white/80">
                <Wind className="w-3 h-3" />
                <span>{Math.round(currentWeather?.wind_speed_kmh || 12)} km/h</span>
              </div>
            </div>
          </div>
        </div>

        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none"></div>
      </CardContent>
    </Card>
  );
};
