
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWeatherData } from '@/hooks/useWeatherData';
import { 
  Sun, 
  Cloud, 
  CloudRain, 
  CloudSnow, 
  Zap, 
  MapPin,
  RefreshCw,
  ChevronRight,
  Thermometer,
  Droplets,
  Wind
} from 'lucide-react';

export const CompactWeatherCard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentWeather, loading, error, refreshWeather } = useWeatherData();

  const getWeatherIcon = (main: string, icon: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'clear': <Sun className="w-10 h-10 text-yellow-500" />,
      'clouds': <Cloud className="w-10 h-10 text-gray-500" />,
      'rain': <CloudRain className="w-10 h-10 text-blue-500" />,
      'drizzle': <CloudRain className="w-10 h-10 text-blue-400" />,
      'thunderstorm': <Zap className="w-10 h-10 text-yellow-600" />,
      'snow': <CloudSnow className="w-10 h-10 text-blue-200" />,
    };

    return iconMap[main?.toLowerCase()] || <Sun className="w-10 h-10 text-yellow-500" />;
  };

  const handleCardClick = () => {
    navigate('/weather');
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-blue-50/90 to-cyan-50/90 backdrop-blur-sm border-white/40 shadow-lg animate-pulse">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div>
                <div className="h-5 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
            <div className="h-10 bg-gray-200 rounded w-16"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !currentWeather) {
    return (
      <Card className="bg-gradient-to-br from-red-50/90 to-red-100/90 backdrop-blur-sm border-red-200/40 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Cloud className="w-10 h-10 text-red-400" />
              <div>
                <p className="font-semibold text-red-700">Weather Unavailable</p>
                <p className="text-sm text-red-600">Tap to retry</p>
              </div>
            </div>
            <button onClick={refreshWeather} className="text-red-600 hover:text-red-700 transition-colors">
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="bg-gradient-to-br from-blue-50/90 via-cyan-50/70 to-sky-50/90 backdrop-blur-sm border-white/40 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group active:scale-[0.98]"
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Weather Info */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              {getWeatherIcon(currentWeather.weather_main, currentWeather.weather_icon)}
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-2xl font-bold text-gray-900">
                  {Math.round(currentWeather.temperature_celsius)}°C
                </span>
                <Badge variant="secondary" className="text-xs px-2 py-1 bg-green-100 text-green-700 border-green-200">
                  Live
                </Badge>
              </div>
              <p className="text-sm text-gray-600 capitalize mb-2">
                {currentWeather.weather_description}
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-xs text-gray-600 font-medium">
                    {Math.round(currentWeather.feels_like_celsius)}°
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-xs text-gray-600 font-medium">
                    {currentWeather.humidity_percent}%
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Wind className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-xs text-gray-600 font-medium">
                    {Math.round(currentWeather.wind_speed_kmh)} km/h
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Indicator */}
          <div className="flex flex-col items-end">
            <div className="text-right mb-2">
              <p className="text-xs text-gray-500 font-medium">View Details</p>
              <p className="text-xs text-gray-400">Full forecast</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-200" />
          </div>
        </div>

        {/* Location and Time indicator */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/30">
          <div className="flex items-center space-x-1">
            <MapPin className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500 font-medium">Live Location Data</span>
          </div>
          <span className="text-xs text-gray-500">
            Updated {new Date(currentWeather.observation_time).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
