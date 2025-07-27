
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useEnhancedWeatherData } from '@/hooks/useEnhancedWeatherData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, MapPin, Thermometer, Eye, AlertCircle } from 'lucide-react';

export const WeatherDebugPanel: React.FC = () => {
  const { location } = useSelector((state: RootState) => state.farmer);
  const { 
    currentWeather, 
    loading, 
    error, 
    lastFetch, 
    refreshWeather, 
    hasLocation 
  } = useEnhancedWeatherData();

  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }

  return (
    <Card className="m-4 border-dashed border-orange-300 bg-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-orange-800 flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Weather Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Location Status */}
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-blue-500" />
          <span className="font-medium">Location:</span>
          {hasLocation ? (
            <span className="text-green-600">
              {location?.latitude.toFixed(4)}, {location?.longitude.toFixed(4)}
              {location?.district && ` (${location.district})`}
            </span>
          ) : (
            <span className="text-red-500">Not available</span>
          )}
        </div>

        {/* Weather Status */}
        <div className="flex items-center gap-2 text-sm">
          <Thermometer className="w-4 h-4 text-blue-500" />
          <span className="font-medium">Weather:</span>
          {loading ? (
            <span className="text-yellow-600">Loading...</span>
          ) : currentWeather ? (
            <span className="text-green-600">
              {currentWeather.temperature_celsius}°C, {currentWeather.weather_description}
              {currentWeather.data_source && ` (${currentWeather.data_source})`}
            </span>
          ) : (
            <span className="text-red-500">No data</span>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-start gap-2 text-sm">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
            <div>
              <span className="font-medium text-red-700">Error:</span>
              <p className="text-red-600 text-xs mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Last Fetch Time */}
        {lastFetch && (
          <div className="text-xs text-gray-600">
            Last fetch: {lastFetch.toLocaleTimeString()}
          </div>
        )}

        {/* Refresh Button */}
        <Button 
          size="sm" 
          variant="outline" 
          onClick={refreshWeather}
          disabled={loading || !hasLocation}
          className="w-full"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Weather Data
        </Button>
      </CardContent>
    </Card>
  );
};
