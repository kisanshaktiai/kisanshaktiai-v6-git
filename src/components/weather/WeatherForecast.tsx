import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CloudRain, Sun, Cloud, Wind } from 'lucide-react';

interface WeatherForecastProps {
  latitude: number;
  longitude: number;
}

export const WeatherForecast: React.FC<WeatherForecastProps> = ({ latitude, longitude }) => {
  const { t } = useTranslation();
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadForecasts();
  }, []);

  const loadForecasts = async () => {
    try {
      // Get user location first
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('coordinates')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (profile?.coordinates) {
        const { data, error } = await supabase
          .from('weather_forecasts')
          .select('*')
          .gte('forecast_time', new Date().toISOString())
          .order('forecast_time')
          .limit(7);

        if (error) throw error;
        setForecasts(data || []);
      }
    } catch (error) {
      console.error('Failed to load forecasts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchForecast = async () => {
      const { data } = await supabase
        .from('weather_forecasts')
        .select('*')
        .eq('latitude', latitude)
        .eq('longitude', longitude)
        .eq('forecast_type', 'hourly')
        .gte('forecast_time', new Date().toISOString())
        .order('forecast_time', { ascending: true })
        .limit(24);

      if (data) setForecasts(data);
      setLoading(false);
    };

    fetchForecast();
  }, [latitude, longitude]);

  const getWeatherIcon = (main: string) => {
    switch (main?.toLowerCase()) {
      case 'clear': return <Sun className="w-6 h-6 text-yellow-500" />;
      case 'rain': return <CloudRain className="w-6 h-6 text-blue-500" />;
      default: return <Cloud className="w-6 h-6 text-gray-500" />;
    }
  };

  if (loading) {
    return <Card><CardContent className="p-6">Loading forecast...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('weather.hourlyForecast', 'Hourly Forecast')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {forecasts.slice(0, 8).map((forecast, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getWeatherIcon(forecast.weather_main)}
                <div>
                  <div className="font-semibold">
                    {new Date(forecast.forecast_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-sm text-gray-600 capitalize">
                    {forecast.weather_description}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{Math.round(forecast.temperature_celsius)}°C</div>
                <div className="text-sm text-gray-600">
                  {forecast.rain_probability_percent}% {t('weather.rain', 'rain')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};