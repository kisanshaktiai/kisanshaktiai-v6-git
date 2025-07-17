import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Eye, 
  Gauge, 
  Sun, 
  Moon,
  CloudRain,
  Sunrise,
  Sunset
} from 'lucide-react';

interface WeatherData {
  temperature_celsius: number;
  feels_like_celsius: number;
  humidity_percent: number;
  pressure_hpa: number;
  wind_speed_kmh: number;
  wind_direction_degrees: number;
  visibility_km: number;
  uv_index: number;
  rain_1h_mm: number;
  rain_24h_mm: number;
  cloud_cover_percent: number;
  weather_main: string;
  weather_description: string;
  weather_icon: string;
  sunrise: string;
  sunset: string;
  moon_phase: number;
  observation_time: string;
}

interface CurrentWeatherCardProps {
  weather: WeatherData;
}

export const CurrentWeatherCard: React.FC<CurrentWeatherCardProps> = ({ weather }) => {
  const { t } = useTranslation();

  const getWeatherIcon = (iconCode: string, main: string) => {
    // Map weather conditions to appropriate icons
    switch (main.toLowerCase()) {
      case 'clear':
        return <Sun className="w-12 h-12 text-yellow-500" />;
      case 'clouds':
        return <div className="w-12 h-12 bg-gray-400 rounded-full" />;
      case 'rain':
        return <CloudRain className="w-12 h-12 text-blue-500" />;
      default:
        return <Sun className="w-12 h-12 text-yellow-500" />;
    }
  };

  const getWindDirection = (degrees: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  const getUVIndexLevel = (uv: number) => {
    if (uv <= 2) return { level: 'Low', color: 'green' };
    if (uv <= 5) return { level: 'Moderate', color: 'yellow' };
    if (uv <= 7) return { level: 'High', color: 'orange' };
    if (uv <= 10) return { level: 'Very High', color: 'red' };
    return { level: 'Extreme', color: 'purple' };
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMoonPhaseIcon = (phase: number) => {
    // Moon phase: 0 = new moon, 0.5 = full moon
    if (phase < 0.125 || phase > 0.875) return '🌑'; // New moon
    if (phase < 0.375) return '🌒'; // Waxing crescent
    if (phase < 0.625) return '🌕'; // Full moon
    return '🌘'; // Waning crescent
  };

  const uvLevel = getUVIndexLevel(weather.uv_index);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Weather Card */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t('weather.currentConditions', 'Current Conditions')}</span>
            <Badge variant="secondary">
              {t('weather.updated', 'Updated')}: {formatTime(weather.observation_time)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              {getWeatherIcon(weather.weather_icon, weather.weather_main)}
              <div>
                <div className="text-4xl font-bold text-gray-900">
                  {Math.round(weather.temperature_celsius)}°C
                </div>
                <div className="text-sm text-gray-600 capitalize">
                  {weather.weather_description}
                </div>
                <div className="text-sm text-gray-500">
                  {t('weather.feelsLike', 'Feels like')} {Math.round(weather.feels_like_celsius)}°C
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">
                {t('weather.cloudCover', 'Cloud Cover')}
              </div>
              <div className="text-lg font-semibold">
                {weather.cloud_cover_percent}%
              </div>
            </div>
          </div>

          {/* Weather Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Droplets className="w-5 h-5 text-blue-500" />
              <div>
                <div className="text-sm text-gray-600">{t('weather.humidity', 'Humidity')}</div>
                <div className="font-semibold">{weather.humidity_percent}%</div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Wind className="w-5 h-5 text-gray-500" />
              <div>
                <div className="text-sm text-gray-600">{t('weather.wind', 'Wind')}</div>
                <div className="font-semibold">
                  {Math.round(weather.wind_speed_kmh)} km/h {getWindDirection(weather.wind_direction_degrees)}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Gauge className="w-5 h-5 text-purple-500" />
              <div>
                <div className="text-sm text-gray-600">{t('weather.pressure', 'Pressure')}</div>
                <div className="font-semibold">{Math.round(weather.pressure_hpa)} hPa</div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Eye className="w-5 h-5 text-green-500" />
              <div>
                <div className="text-sm text-gray-600">{t('weather.visibility', 'Visibility')}</div>
                <div className="font-semibold">{weather.visibility_km} km</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sun & Moon Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('weather.sunMoon', 'Sun & Moon')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sunrise/Sunset */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sunrise className="w-5 h-5 text-orange-500" />
                <span className="text-sm text-gray-600">{t('weather.sunrise', 'Sunrise')}</span>
              </div>
              <span className="font-semibold">{formatTime(weather.sunrise)}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sunset className="w-5 h-5 text-orange-600" />
                <span className="text-sm text-gray-600">{t('weather.sunset', 'Sunset')}</span>
              </div>
              <span className="font-semibold">{formatTime(weather.sunset)}</span>
            </div>
          </div>

          {/* UV Index */}
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{t('weather.uvIndex', 'UV Index')}</span>
              <Badge 
                variant="secondary"
                className={`bg-${uvLevel.color}-100 text-${uvLevel.color}-800`}
              >
                {uvLevel.level}
              </Badge>
            </div>
            <div className="text-2xl font-bold">{weather.uv_index}</div>
          </div>

          {/* Moon Phase */}
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('weather.moonPhase', 'Moon Phase')}</span>
              <span className="text-2xl">{getMoonPhaseIcon(weather.moon_phase)}</span>
            </div>
          </div>

          {/* Rainfall */}
          {(weather.rain_1h_mm > 0 || weather.rain_24h_mm > 0) && (
            <div className="pt-3 border-t">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{t('weather.rain1h', 'Rain (1h)')}</span>
                  <span className="font-semibold">{weather.rain_1h_mm} mm</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{t('weather.rain24h', 'Rain (24h)')}</span>
                  <span className="font-semibold">{weather.rain_24h_mm} mm</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};