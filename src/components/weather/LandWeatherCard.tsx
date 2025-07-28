import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  CloudSnow, 
  Wind, 
  Droplets, 
  Thermometer,
  Eye,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  conditions: string;
  precipitation: number;
  uvIndex: number;
  visibility: number;
  pressure: number;
  recommendation: string;
  alerts?: string[];
  soilMoisture?: number;
  evapotranspiration?: number;
}

interface LandWeatherCardProps {
  landId: string;
  latitude: number;
  longitude: number;
  cropType?: string;
  compact?: boolean;
}

export const LandWeatherCard: React.FC<LandWeatherCardProps> = ({
  landId,
  latitude,
  longitude,
  cropType,
  compact = false
}) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchWeatherData();
    // Update every 30 minutes
    const interval = setInterval(fetchWeatherData, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [landId, latitude, longitude]);

  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API call to weather service
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock weather data - in real implementation, this would fetch from weather API
      const mockData: WeatherData = {
        temperature: 24 + Math.random() * 10,
        humidity: 60 + Math.random() * 30,
        windSpeed: 5 + Math.random() * 15,
        conditions: ['sunny', 'partly-cloudy', 'cloudy', 'rainy'][Math.floor(Math.random() * 4)],
        precipitation: Math.random() * 5,
        uvIndex: 3 + Math.random() * 8,
        visibility: 8 + Math.random() * 2,
        pressure: 1010 + Math.random() * 20,
        recommendation: cropType ? `Optimal ${cropType} growing conditions` : 'Good farming conditions',
        alerts: Math.random() > 0.7 ? ['High wind advisory'] : [],
        soilMoisture: 40 + Math.random() * 40,
        evapotranspiration: 3 + Math.random() * 4,
      };

      setWeatherData(mockData);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to fetch weather data');
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (conditions: string) => {
    switch (conditions) {
      case 'sunny': return Sun;
      case 'partly-cloudy': return Cloud;
      case 'cloudy': return Cloud;
      case 'rainy': return CloudRain;
      case 'snowy': return CloudSnow;
      default: return Sun;
    }
  };

  const getWeatherColor = (conditions: string) => {
    switch (conditions) {
      case 'sunny': return 'text-yellow-500';
      case 'partly-cloudy': return 'text-blue-400';
      case 'cloudy': return 'text-gray-500';
      case 'rainy': return 'text-blue-600';
      case 'snowy': return 'text-blue-200';
      default: return 'text-gray-500';
    }
  };

  const handleRefresh = () => {
    fetchWeatherData();
    toast({
      title: 'Weather Updated',
      description: 'Fetching latest weather data...',
    });
  };

  if (loading) {
    return <LoadingSkeleton variant="weatherCard" />;
  }

  if (error || !weatherData) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-sm text-destructive">Weather unavailable</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRefresh}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const WeatherIcon = getWeatherIcon(weatherData.conditions);
  const iconColor = getWeatherColor(weatherData.conditions);

  if (compact) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-sky-50 to-blue-50">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <WeatherIcon className={`w-8 h-8 ${iconColor}`} />
              <div>
                <div className="text-lg font-semibold">{Math.round(weatherData.temperature)}°C</div>
                <div className="text-xs text-muted-foreground capitalize">
                  {weatherData.conditions.replace('-', ' ')}
                </div>
              </div>
            </div>
            <div className="text-right space-y-1">
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <Droplets className="w-3 h-3" />
                <span>{weatherData.humidity}%</span>
              </div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <Wind className="w-3 h-3" />
                <span>{Math.round(weatherData.windSpeed)} km/h</span>
              </div>
            </div>
          </div>
          
          {weatherData.alerts && weatherData.alerts.length > 0 && (
            <div className="mt-2 pt-2 border-t border-orange-200">
              <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {weatherData.alerts[0]}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-sky-50 to-blue-50">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <WeatherIcon className={`w-10 h-10 ${iconColor}`} />
            <div>
              <div className="text-2xl font-bold">{Math.round(weatherData.temperature)}°C</div>
              <div className="text-sm text-muted-foreground capitalize">
                {weatherData.conditions.replace('-', ' ')}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleRefresh}>
            <Eye className="w-4 h-4" />
          </Button>
        </div>

        {/* Weather metrics grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center space-y-1">
            <Droplets className="w-4 h-4 mx-auto text-blue-500" />
            <div className="text-sm font-medium">{weatherData.humidity}%</div>
            <div className="text-xs text-muted-foreground">Humidity</div>
          </div>
          <div className="text-center space-y-1">
            <Wind className="w-4 h-4 mx-auto text-gray-500" />
            <div className="text-sm font-medium">{Math.round(weatherData.windSpeed)} km/h</div>
            <div className="text-xs text-muted-foreground">Wind</div>
          </div>
          <div className="text-center space-y-1">
            <CloudRain className="w-4 h-4 mx-auto text-blue-600" />
            <div className="text-sm font-medium">{weatherData.precipitation.toFixed(1)} mm</div>
            <div className="text-xs text-muted-foreground">Rain</div>
          </div>
        </div>

        {/* Agricultural insights */}
        {(weatherData.soilMoisture || weatherData.evapotranspiration) && (
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-sky-200">
            {weatherData.soilMoisture && (
              <div className="text-center space-y-1">
                <div className="text-sm font-medium text-green-600">
                  {Math.round(weatherData.soilMoisture)}%
                </div>
                <div className="text-xs text-muted-foreground">Soil Moisture</div>
              </div>
            )}
            {weatherData.evapotranspiration && (
              <div className="text-center space-y-1">
                <div className="text-sm font-medium text-orange-600">
                  {weatherData.evapotranspiration.toFixed(1)} mm
                </div>
                <div className="text-xs text-muted-foreground">ET₀</div>
              </div>
            )}
          </div>
        )}

        {/* Recommendation */}
        <div className="p-2 bg-green-50 border border-green-200 rounded-md">
          <p className="text-xs text-green-800">{weatherData.recommendation}</p>
        </div>

        {/* Alerts */}
        {weatherData.alerts && weatherData.alerts.length > 0 && (
          <div className="space-y-2">
            {weatherData.alerts.map((alert, index) => (
              <Badge key={index} variant="secondary" className="w-full justify-start bg-orange-100 text-orange-800">
                <AlertTriangle className="w-3 h-3 mr-2" />
                {alert}
              </Badge>
            ))}
          </div>
        )}

        {/* Last updated */}
        {lastUpdated && (
          <div className="text-xs text-muted-foreground text-center">
            Updated {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};