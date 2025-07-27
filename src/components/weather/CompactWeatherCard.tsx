
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
  Droplets
} from 'lucide-react';

export const CompactWeatherCard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentWeather, loading, error, refreshWeather } = useWeatherData();

  const getWeatherIcon = (main: string, icon: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'clear': <Sun className="w-8 h-8 text-yellow-500" />,
      'clouds': <Cloud className="w-8 h-8 text-gray-500" />,
      'rain': <CloudRain className="w-8 h-8 text-blue-500" />,
      'drizzle': <CloudRain className="w-8 h-8 text-blue-400" />,
      'thunderstorm': <Zap className="w-8 h-8 text-yellow-600" />,
      'snow': <CloudSnow className="w-8 h-8 text-blue-200" />,
    };

    return iconMap[main?.toLowerCase()] || <Sun className="w-8 h-8 text-yellow-500" />;
  };

  const handleCardClick = () => {
    navigate('/weather');
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-blue-50/80 to-cyan-50/80 backdrop-blur-sm border-white/30 shadow-lg animate-pulse">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div>
                <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-12"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !currentWeather) {
    return (
      <Card className="bg-gradient-to-br from-red-50/80 to-red-100/80 backdrop-blur-sm border-red-200/30 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Cloud className="w-8 h-8 text-red-400" />
              <div>
                <p className="text-sm font-medium text-red-700">Weather Unavailable</p>
                <p className="text-xs text-red-600">Tap to retry</p>
              </div>
            </div>
            <button onClick={refreshWeather} className="text-red-600">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="bg-gradient-to-br from-blue-50/80 via-cyan-50/60 to-sky-50/80 backdrop-blur-sm border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group active:scale-[0.98]"
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Weather Info */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              {getWeatherIcon(currentWeather.weather_main, currentWeather.weather_icon)}
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-gray-900">
                  {Math.round(currentWeather.temperature_celsius)}°C
                </span>
                <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700">
                  Live
                </Badge>
              </div>
              <p className="text-xs text-gray-600 capitalize leading-tight">
                {currentWeather.weather_description}
              </p>
              <div className="flex items-center space-x-3 mt-1">
                <div className="flex items-center space-x-1">
                  <Thermometer className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-500">
                    {Math.round(currentWeather.feels_like_celsius)}°
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Droplets className="w-3 h-3 text-blue-500" />
                  <span className="text-xs text-gray-500">
                    {currentWeather.humidity_percent}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Indicator */}
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <p className="text-xs text-gray-500">View Details</p>
              <p className="text-xs text-gray-400">Tap here</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </div>
        </div>

        {/* Location indicator */}
        <div className="flex items-center space-x-1 mt-2 pt-2 border-t border-white/20">
          <MapPin className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-500">
            {new Date(currentWeather.observation_time).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit'
            })} • Real-time data
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
